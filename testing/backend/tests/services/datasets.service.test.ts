import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as datasetsService from '@/services/datasets.service';
import * as datasetsRepository from '@/repositories/datasets.repository';

vi.mock('@/repositories/datasets.repository');

// 👇 Corrección del Error 1: Usamos una clase real para mockear S3Client 👇
vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: class {
      send() {
        return Promise.resolve({ $metadata: { httpStatusCode: 204 } });
      }
    },
    GetObjectCommand: class {},
    DeleteObjectCommand: class {}
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: vi.fn() }));
vi.mock('@/config/env', () => ({ env: { S3_BUCKET_NAME: 'test-bucket' } }));

describe('Datasets Service - Zod y S3 Sincronizados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('getDatasets()', () => {
    it('debería llamar al repo con el offset y los filtros correctos', async () => {
      vi.mocked(datasetsRepository.fetchDatasetsPaginated).mockResolvedValue({ total: 25, data: [{}] } as any);
      const result = await datasetsService.getDatasets(1, false, 'buscar', 3, 10);
      
      expect(result.totalPages).toBe(3);
      expect(datasetsRepository.fetchDatasetsPaginated).toHaveBeenCalledWith(1, false, 'buscar', 10, 20, expect.anything());
    });
  });

  describe('createDataset()', () => {
    it('debería lanzar ZodError si faltan campos', async () => {
      await expect(datasetsService.createDataset(1, false, { title: '' })).rejects.toThrow();
    });

    it('debería enriquecer los archivos y guardar en BD', async () => {
      const validData = {
        title: 'Valid', category_id: 1, license_id: 1, summary: 's', description: 'd', creation_date: '2023-01-01', 
        // 👇 SOLUCIÓN: Zod exige al menos un archivo válido en el array
        files: [{ 
          storage_key: 'fake', file_url: 'http://fake.com', display_name: 'test.pdf', 
          file_format: 'pdf', mime_type: 'application/pdf', file_size_bytes: 100 
        }] 
      };
      vi.mocked(datasetsRepository.createFullDatasetInDb).mockResolvedValue({ dataset_id: 10 } as any);
      
      await datasetsService.createDataset(1, false, validData);
      expect(datasetsRepository.createFullDatasetInDb).toHaveBeenCalledWith(1, false, expect.anything());
    });
  });

  describe('removeDataset()', () => {
    it('debería procesar eliminación silenciosa en S3', async () => {
      vi.mocked(datasetsRepository.softDeleteDatasetInDb).mockResolvedValue({
        dataset: { title: 'Eliminado' },
        filesToDelete: [{ storage_key: 'uploads/borrar.pdf' }]
      } as any);

      const result = await datasetsService.removeDataset(1, 1);
      expect(result.message).toContain('fue eliminado correctamente');
    });
  });

  describe('editDataset()', () => {
    it('debería actualizar los datos correctamente', async () => {
      vi.mocked(datasetsRepository.updateDatasetInDb).mockResolvedValue({ updatedDataset: { dataset_id: 1 } } as any);
      await datasetsService.editDataset(1, 1, { title: 'Editado' });
      expect(datasetsRepository.updateDatasetInDb).toHaveBeenCalledWith(1, 1, { title: 'Editado' });
    });
  });
});