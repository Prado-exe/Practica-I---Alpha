import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as datasetsService from '@/services/datasets.service';
import * as datasetsRepository from '@/repositories/datasets.repository';
import { AppError } from '@/types/app-error';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '@/config/s3';

// ==========================================
// 1. MOCKS DE DEPENDENCIAS EXTERNAS
// ==========================================
vi.mock('@/repositories/datasets.repository');

// Mockeamos la librería de AWS S3
vi.mock('@aws-sdk/client-s3', () => ({
  GetObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn()
}));

// Mockeamos el generador de URLs prefirmadas
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn()
}));

// Mockeamos el cliente S3 local
vi.mock('@/config/s3', () => ({
  s3Client: { send: vi.fn() }
}));

// Mockeamos las variables de entorno
vi.mock('@/config/env', () => ({
  env: { S3_BUCKET_NAME: 'test-bucket' }
}));

// ==========================================
// 2. SUITE DE PRUEBAS - COBERTURA 100%
// ==========================================
describe('Datasets Service - Cobertura 100%', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Silenciamos los console.log, warn y error para que la terminal de test quede limpia
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  // --------------------------------------------------------
  // TEST: getDatasets() (Paginación)
  // --------------------------------------------------------
  describe('getDatasets()', () => {
    it('debería calcular el offset correctamente y retornar datos paginados', async () => {
      const mockData = { total: 25, data: [{ dataset_id: 1, title: 'Test' }] };
      vi.mocked(datasetsRepository.fetchDatasetsPaginated).mockResolvedValue(mockData as any);

      // Pedimos la página 3 con límite de 10
      const result = await datasetsService.getDatasets(1, false, 'buscar', 3, 10);
      
      expect(result.totalPages).toBe(3); // 25 / 10 = ceil(2.5) = 3
      expect(result.data[0].title).toBe('Test');
      // offset esperado: (3 - 1) * 10 = 20
      expect(datasetsRepository.fetchDatasetsPaginated).toHaveBeenCalledWith(1, false, 'buscar', 10, 20);
    });
  });

  // --------------------------------------------------------
  // TEST: createDataset() (Zod Validation & Creación)
  // --------------------------------------------------------
  describe('createDataset()', () => {
    it('debería lanzar error de Zod si faltan campos obligatorios o archivos', async () => {
      // Faltan archivos y muchos campos
      await expect(datasetsService.createDataset(1, false, { title: '' })).rejects.toThrow(); 
    });

    it('debería validar datos, guardar en BD, registrar evento y retornar', async () => {
      // Objeto perfecto que aprueba Zod al 100%
      const validData = {
        title: 'Valid', category_id: 1, license_id: 1, summary: 'sum', description: 'desc',
        creation_date: '2023-01-01', access_level: 'public',
        files: [{
          storage_key: 'fake_key', file_url: 'http://fake.com', display_name: 'test.pdf',
          file_format: 'pdf', mime_type: 'application/pdf', file_size_bytes: 1024
        }] 
      };
      
      vi.mocked(datasetsRepository.createFullDatasetInDb).mockResolvedValue({ dataset_id: 10 } as any);
      vi.mocked(datasetsRepository.recordDatasetEvent).mockResolvedValue();

      const result = await datasetsService.createDataset(1, false, validData);
      
      expect(datasetsRepository.createFullDatasetInDb).toHaveBeenCalled();
      expect(datasetsRepository.recordDatasetEvent).toHaveBeenCalledWith(expect.objectContaining({
        dataset_id: 10,
        event_type: 'created'
      }));
      expect(result).toEqual({ dataset_id: 10 });
    });
  });

  // --------------------------------------------------------
  // TEST: getDatasetById() (Detalles y Firmas S3)
  // --------------------------------------------------------
  describe('getDatasetById()', () => {
    it('debería lanzar AppError 404 si el dataset no existe', async () => {
      vi.mocked(datasetsRepository.fetchDatasetDetailsFromDb).mockResolvedValue(null);
      await expect(datasetsService.getDatasetById(99)).rejects.toThrow(new AppError('Dataset no encontrado', 404));
    });

    it('debería devolver el dataset intacto si no tiene archivos', async () => {
      vi.mocked(datasetsRepository.fetchDatasetDetailsFromDb).mockResolvedValue({ title: 'Sin archivos', files: [] } as any);
      const result = await datasetsService.getDatasetById(1);
      expect(result.files).toEqual([]);
    });

    it('debería firmar las URLs de los archivos y reemplazar la red interna', async () => {
      vi.mocked(datasetsRepository.fetchDatasetDetailsFromDb).mockResolvedValue({
        files: [
          { storage_key: 'uploads/123.pdf' }, // Archivo normal
          { storage_key: null }               // Archivo dañado sin llave
        ]
      } as any);
      
      vi.mocked(getSignedUrl).mockResolvedValue('http://storage:9000/test-bucket/uploads/123.pdf?signature=abc');

      const result = await datasetsService.getDatasetById(1);

      // Verifica el reemplazo "storage" -> "localhost"
      expect(result.files[0].file_url).toBe('http://localhost:9000/test-bucket/uploads/123.pdf?signature=abc');
      expect(result.files[1].storage_key).toBeNull(); // Se ignora el dañado
    });

    it('debería devolver el archivo original si la firma en MinIO falla', async () => {
      vi.mocked(datasetsRepository.fetchDatasetDetailsFromDb).mockResolvedValue({
        files: [{ storage_key: 'uploads/error.pdf', file_url: 'original_url' }]
      } as any);
      
      vi.mocked(getSignedUrl).mockRejectedValue(new Error('S3 down'));

      const result = await datasetsService.getDatasetById(1);

      // Si falla, debe devolver la URL original para no romper el frontend
      expect(result.files[0].file_url).toBe('original_url');
      expect(console.error).toHaveBeenCalled(); // Verificamos que se haya registrado el error en consola
    });
  });

  // --------------------------------------------------------
  // TEST: removeDataset() (Soft Delete y Borrado Físico)
  // --------------------------------------------------------
  describe('removeDataset()', () => {
    it('debería mapear "no encontrado" a un AppError 404', async () => {
      vi.mocked(datasetsRepository.softDeleteDatasetInDb).mockRejectedValue(new Error('Dataset no encontrado o ya eliminado'));
      await expect(datasetsService.removeDataset(1, 1)).rejects.toThrow(new AppError('Dataset no encontrado o ya eliminado', 404));
    });

    it('debería propagar otros errores de BD sin modificarlos', async () => {
      vi.mocked(datasetsRepository.softDeleteDatasetInDb).mockRejectedValue(new Error('Error de conexión DB'));
      await expect(datasetsService.removeDataset(1, 1)).rejects.toThrow('Error de conexión DB');
    });

    it('debería procesar eliminación en BD y MinIO correctamente', async () => {
      vi.mocked(datasetsRepository.softDeleteDatasetInDb).mockResolvedValue({
        dataset: { title: 'Eliminado' },
        filesToDelete: [
          { storage_key: 'uploads/borrar.pdf' },
          { aws_file_reference_id: 5 } // Simula un archivo sin key
        ]
      } as any);
      
      vi.mocked(s3Client.send).mockResolvedValue({ $metadata: { httpStatusCode: 204 } } as any);

      const result = await datasetsService.removeDataset(1, 1);

      expect(s3Client.send).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('no tiene storage_key válido'));
      expect(result.message).toBe("El dataset 'Eliminado' fue eliminado correctamente.");
    });

    it('NO debe romper el flujo si la eliminación en MinIO falla (Falla silenciosa)', async () => {
      vi.mocked(datasetsRepository.softDeleteDatasetInDb).mockResolvedValue({
        dataset: { title: 'Semi-Eliminado' },
        filesToDelete: [{ storage_key: 'uploads/falla.pdf' }]
      } as any);
      
      vi.mocked(s3Client.send).mockRejectedValue(new Error('AccessDenied S3'));

      const result = await datasetsService.removeDataset(1, 1);

      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('FALLO CRÍTICO AL BORRAR EN MINIO'));
      // A pesar del error en MinIO, el backend le dice al usuario que se borró de la BD
      expect(result.message).toBe("El dataset 'Semi-Eliminado' fue eliminado correctamente.");
    });
  });

  // --------------------------------------------------------
  // TEST: editDataset()
  // --------------------------------------------------------
  describe('editDataset()', () => {
    it('debería mapear "no encontrado" a AppError 404', async () => {
      vi.mocked(datasetsRepository.updateDatasetInDb).mockRejectedValue(new Error('Dataset no encontrado'));
      await expect(datasetsService.editDataset(1, 1, {})).rejects.toThrow(new AppError('Dataset no encontrado', 404));
    });

    it('debería actualizar los datos correctamente', async () => {
      vi.mocked(datasetsRepository.updateDatasetInDb).mockResolvedValue({ dataset_id: 1, title: 'Editado' } as any);
      
      const result = await datasetsService.editDataset(1, 1, { title: 'Editado' });
      
      expect(datasetsRepository.updateDatasetInDb).toHaveBeenCalledWith(1, 1, { title: 'Editado' });
      expect(result.title).toBe('Editado');
    });
  });
});