import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as datasetsService from '@/services/datasets.service';
import * as datasetsRepository from '@/repositories/datasets.repository';
import { AppError } from '@/types/app-error';
import { S3Client } from '@aws-sdk/client-s3';

// 1. MOCK DE DEPENDENCIAS
vi.mock('@/repositories/datasets.repository');
vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: vi.fn() }));
vi.mock('@/config/env', () => ({ env: { S3_BUCKET_NAME: 'test-bucket' } }));

describe('Datasets Service - Cobertura Total (100%)', () => {
  
  let s3SendSpy: any;

  const validBaseData = {
    title: 'Valid', category_id: 1, license_id: 1, summary: 's', description: 'd', creation_date: '2023-01-01', 
    files: [{ 
      storage_key: 'fake', file_url: 'http://fake.com', display_name: 'test.pdf', 
      file_format: 'pdf', mime_type: 'application/pdf', file_size_bytes: 100 
    }] 
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 👇 EL TRUCO MAESTRO: Espiamos el prototipo real para interceptar la red sin importar el "require" 👇
    s3SendSpy = vi.spyOn(S3Client.prototype, 'send').mockResolvedValue({ $metadata: { httpStatusCode: 204 } } as any);

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  // ==========================================
  // GET DATASETS
  // ==========================================
  describe('getDatasets()', () => {
    it('debería calcular el offset correctamente y llamar al repositorio', async () => {
      vi.mocked(datasetsRepository.fetchDatasetsPaginated).mockResolvedValue({ total: 25, data: [{}] } as any);
      const result = await datasetsService.getDatasets(1, false, 'buscar', 3, 10);
      
      expect(result.totalPages).toBe(3);
      expect(datasetsRepository.fetchDatasetsPaginated).toHaveBeenCalledWith(1, false, 'buscar', 10, 20, expect.anything());
    });
  });

  // ==========================================
  // CREATE DATASET
  // ==========================================
  describe('createDataset()', () => {
    it('debería lanzar ZodError si faltan campos obligatorios', async () => {
      await expect(datasetsService.createDataset(1, false, { title: '' })).rejects.toThrow();
    });

    it('debería validar, insertar y registrar el evento de auditoría', async () => {
      vi.mocked(datasetsRepository.createFullDatasetInDb).mockResolvedValue({ dataset_id: 10 } as any);
      await datasetsService.createDataset(1, false, validBaseData);
      
      expect(datasetsRepository.createFullDatasetInDb).toHaveBeenCalledWith(1, false, expect.anything());
      expect(datasetsRepository.recordDatasetEvent).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'created' }));
    });
  });

  // ==========================================
  // GET DATASET BY ID
  // ==========================================
  describe('getDatasetById()', () => {
    it('debería lanzar AppError 404 si el dataset no existe', async () => {
      vi.mocked(datasetsRepository.fetchDatasetDetailsFromDb).mockResolvedValue(null);
      await expect(datasetsService.getDatasetById(99)).rejects.toThrow(new AppError("Dataset no encontrado", 404));
    });

    it('debería retornar el dataset intacto si no tiene archivos', async () => {
      vi.mocked(datasetsRepository.fetchDatasetDetailsFromDb).mockResolvedValue({ id: 1, files: [] } as any);
      const res = await datasetsService.getDatasetById(1);
      expect(res.files).toEqual([]);
    });

    it('debería firmar URLs y saltarse archivos dañados sin storage_key', async () => {
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      vi.mocked(getSignedUrl).mockResolvedValue('http://storage:9000/signed');

      vi.mocked(datasetsRepository.fetchDatasetDetailsFromDb).mockResolvedValue({
        id: 1, files: [{ storage_key: 'key1' }, { no_key: true }]
      } as any);

      const res = await datasetsService.getDatasetById(1);
      
      expect(res.files[0].file_url).toBe('http://localhost:9000/signed');
      expect(res.files[1]).toHaveProperty('no_key');
    });

    it('debería capturar el error de S3, imprimirlo, y no romper la consulta general', async () => {
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      vi.mocked(getSignedUrl).mockRejectedValue(new Error('S3 Offline'));

      vi.mocked(datasetsRepository.fetchDatasetDetailsFromDb).mockResolvedValue({
        id: 1, files: [{ storage_key: 'key1' }]
      } as any);

      const res = await datasetsService.getDatasetById(1);
      
      expect(console.error).toHaveBeenCalled();
      expect(res.files[0]).toHaveProperty('storage_key', 'key1');
      expect(res.files[0]).not.toHaveProperty('file_url');
    });
  });

  // ==========================================
  // REMOVE DATASET
  // ==========================================
  describe('removeDataset()', () => {
    it('debería lanzar AppError 404 si el repositorio indica que no existe', async () => {
      vi.mocked(datasetsRepository.softDeleteDatasetInDb).mockRejectedValue(new Error("Dataset no encontrado"));
      await expect(datasetsService.removeDataset(1, 1)).rejects.toThrow(new AppError("Dataset no encontrado", 404));
    });

    it('debería propagar errores de base de datos no esperados', async () => {
      vi.mocked(datasetsRepository.softDeleteDatasetInDb).mockRejectedValue(new Error("Database offline"));
      await expect(datasetsService.removeDataset(1, 1)).rejects.toThrow("Database offline");
    });

    it('debería funcionar exitosamente aunque no tenga archivos', async () => {
      vi.mocked(datasetsRepository.softDeleteDatasetInDb).mockResolvedValue({ dataset: { title: 'T1' }, filesToDelete: [] } as any);
      const res = await datasetsService.removeDataset(1, 1);
      expect(res.message).toContain("T1");
    });

    it('debería borrar de MinIO y emitir advertencia por archivos sin llave', async () => {
      vi.mocked(datasetsRepository.softDeleteDatasetInDb).mockResolvedValue({
        dataset: { title: 'T1' }, filesToDelete: [{ storage_key: 'key1' }, { aws_file_reference_id: 2 }]
      } as any);

      await datasetsService.removeDataset(1, 1);
      expect(s3SendSpy).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('no tiene storage_key válido'));
    });

    it('debería capturar de forma silenciosa si MinIO falla al eliminar un archivo', async () => {
      vi.mocked(datasetsRepository.softDeleteDatasetInDb).mockResolvedValue({
        dataset: { title: 'T1' }, filesToDelete: [{ storage_key: 'key1' }]
      } as any);
      
      s3SendSpy.mockRejectedValueOnce(new Error("Access Denied"));
      
      await datasetsService.removeDataset(1, 1);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('FALLO CRÍTICO AL BORRAR EN MINIO'));
    });
  });

  // ==========================================
  // EDIT DATASET
  // ==========================================
  describe('editDataset()', () => {
    it('debería lanzar AppError 404 si el dataset no existe', async () => {
      vi.mocked(datasetsRepository.updateDatasetInDb).mockRejectedValue(new Error("Dataset no encontrado"));
      await expect(datasetsService.editDataset(1, 1, {})).rejects.toThrow(new AppError("Dataset no encontrado", 404));
    });

    it('debería propagar error genérico de base de datos', async () => {
      vi.mocked(datasetsRepository.updateDatasetInDb).mockRejectedValue(new Error("Timeout"));
      await expect(datasetsService.editDataset(1, 1, {})).rejects.toThrow("Timeout");
    });

    it('debería actualizar exitosamente y borrar llaves viejas en MinIO', async () => {
      vi.mocked(datasetsRepository.updateDatasetInDb).mockResolvedValue({
        updatedDataset: { id: 1 }, s3KeysToDelete: ['old1', 'old2']
      } as any);

      const res = await datasetsService.editDataset(1, 1, {});
      expect(res).toEqual({ id: 1 });
      expect(s3SendSpy).toHaveBeenCalledTimes(2);
    });

    it('debería capturar el error silenciosamente si MinIO falla al borrar un archivo', async () => {
      vi.mocked(datasetsRepository.updateDatasetInDb).mockResolvedValue({
        updatedDataset: { id: 1 }, s3KeysToDelete: ['old1']
      } as any);

      s3SendSpy.mockRejectedValueOnce(new Error("MinIO Down"));

      await datasetsService.editDataset(1, 1, {});
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('FALLO AL BORRAR'));
    });
  });

  // ==========================================
  // SUBMIT DATASET REQUEST
  // ==========================================
  describe('submitDatasetRequest()', () => {
    it('debería lanzar ZodError si el payload principal es inválido', async () => {
      await expect(datasetsService.submitDatasetRequest(1, {})).rejects.toThrow();
    });

    it('debería lanzar AppError 400 si se pide revisión pero el mensaje es corto o vacío', async () => {
      const invalidData = { ...validBaseData, dataset_status: 'pending_validation', message: 'corto' };
      await expect(datasetsService.submitDatasetRequest(1, invalidData))
        .rejects.toThrow(new AppError("Por favor, incluye un mensaje descriptivo para el revisor (mínimo 10 caracteres).", 400));
    });

    it('debería procesar la solicitud si es borrador (draft) sin requerir mensaje', async () => {
      const draftData = { ...validBaseData, dataset_status: 'draft' };
      vi.mocked(datasetsRepository.createDatasetRequestInDb).mockResolvedValue({ dataset_id: 10 } as any);
      
      const res = await datasetsService.submitDatasetRequest(1, draftData);
      expect(res.dataset_id).toBe(10);
    });

    it('debería procesar la solicitud para pending_validation con mensaje válido', async () => {
      const validReq = { ...validBaseData, dataset_status: 'pending_validation', message: 'Mensaje descriptivo válido' };
      vi.mocked(datasetsRepository.createDatasetRequestInDb).mockResolvedValue({ dataset_id: 11 } as any);
      
      const res = await datasetsService.submitDatasetRequest(1, validReq);
      expect(res.dataset_id).toBe(11);
    });
  });

  // ==========================================
  // RESOLVE DATASET REQUEST
  // ==========================================
  describe('resolveDatasetRequest()', () => {
    it('debería lanzar ZodError si falta el comentario o es menor a 5 caracteres', async () => {
      await expect(datasetsService.resolveDatasetRequest(1, 2, { action: 'publish', review_comment: 'no' })).rejects.toThrow();
    });

    it('debería resolver la solicitud con los datos validados', async () => {
      vi.mocked(datasetsRepository.resolveDatasetRequestInDb).mockResolvedValue({ message: 'OK' } as any);
      
      const res = await datasetsService.resolveDatasetRequest(1, 2, { action: 'reject', review_comment: 'Rechazado por X motivo.' });
      
      expect(datasetsRepository.resolveDatasetRequestInDb).toHaveBeenCalledWith(1, 2, 'reject', 'Rechazado por X motivo.');
      expect(res.message).toBe('OK');
    });

    it('debería propagar errores de base de datos desde el repositorio', async () => {
      vi.mocked(datasetsRepository.resolveDatasetRequestInDb).mockRejectedValue(new Error("Crash DB"));
      await expect(datasetsService.resolveDatasetRequest(1, 2, { action: 'publish', review_comment: 'Todo bien' })).rejects.toThrow("Crash DB");
    });
  });
});