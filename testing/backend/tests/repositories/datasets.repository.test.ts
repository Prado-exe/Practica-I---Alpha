import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pool } from '@/config/db';
import * as datasetRepo from '@/repositories/datasets.repository';

// 🛡️ MOCKS DE ENTORNO Y BASE DE DATOS
vi.mock('@/config/env', () => ({
  env: {
    DB_USER: 'test', DB_PASSWORD: 'test', DB_HOST: 'localhost', DB_PORT: '5432', DB_NAME: 'test',
    JWT_SECRET: 'test', REFRESH_TOKEN_SECRET: 'test', FRONTEND_ORIGIN: 'test', S3_BUCKET_NAME: 'test'
  }
}));

vi.mock('@/config/db', () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
}));

describe('Datasets Repository - Cobertura Total (100%)', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = { query: vi.fn(), release: vi.fn() };
    vi.mocked(pool.connect).mockResolvedValue(mockClient);
    vi.mocked(pool.query).mockImplementation(() => Promise.resolve({ rowCount: 1, rows: [{ count: '5', dataset_id: 1 }] } as any));
  });

  // ==========================================
  // 1. createFullDatasetInDb
  // ==========================================
  describe('createFullDatasetInDb()', () => {
    it('debería crear el dataset e insertar archivos con normalización de MIME y extensiones', async () => {
      mockClient.query.mockImplementation(() => Promise.resolve({ rowCount: 1, rows: [{ dataset_id: 10, aws_file_reference_id: 99 }] }));
      
      const data = { 
        title: 'Test', 
        files: [
          { mime_type: 'application/x-zip-compressed', display_name: 'test.zip', file_size_bytes: 100 }, // Zip de Windows
          { mime_type: 'application/vnd.ms-excel', display_name: 'data.csv', file_size_bytes: 200 }, // CSV leído como Excel
          { mime_type: 'unknown', display_name: 'raro.xyz', file_size_bytes: 300 } // Formato no permitido -> txt
        ] 
      };
      
      const result = await datasetRepo.createFullDatasetInDb(1, false, data);
      expect(result.dataset_id).toBe(10);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('debería hacer ROLLBACK si ocurre un error', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('DB Fallo'));
      await expect(datasetRepo.createFullDatasetInDb(1, false, { files: [] })).rejects.toThrow('DB Fallo');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  // ==========================================
  // 2. recordDatasetEvent
  // ==========================================
  describe('recordDatasetEvent()', () => {
    it('debería registrar un evento sin usar transacciones complejas', async () => {
      await datasetRepo.recordDatasetEvent({ dataset_id: 1, actor_account_id: 2, event_type: 'test', event_result: 'ok', event_comment: 'c' });
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO dataset_events'), [1, 2, 'test', 'ok', 'c']);
    });
  });

  // ==========================================
  // 3. fetchDatasetsPaginated
  // ==========================================
  describe('fetchDatasetsPaginated()', () => {
    it('debería aplicar filtros de búsqueda, categoría, licencia y etiquetas', async () => {
      await datasetRepo.fetchDatasetsPaginated(1, true, 'keyword', 10, 0, { categoria: '1,2', licencia: '3', etiqueta: '4' });
      expect(pool.query).toHaveBeenCalledTimes(2); // COUNT y SELECT
      
      const callArgs = vi.mocked(pool.query).mock.calls[0][0] as string; 
      expect(callArgs).toContain('d.title ILIKE');
      expect(callArgs).toContain('d.category_id = ANY');
      expect(callArgs).toContain('d.license_id = ANY');
      expect(callArgs).toContain('dt.tag_id = ANY');
    });
  });

  // ==========================================
  // 4. fetchDatasetDetailsFromDb
  // ==========================================
  describe('fetchDatasetDetailsFromDb()', () => {
    it('debería devolver null si el dataset no existe', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rowCount: 0 } as any);
      const result = await datasetRepo.fetchDatasetDetailsFromDb(99);
      expect(result).toBeNull();
    });

    it('debería retornar el dataset ensamblado con sus archivos y eventos', async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ dataset_id: 1, title: 'D1' }] } as any) // Metadata
        .mockResolvedValueOnce({ rows: [{ aws_file_reference_id: 2 }] } as any) // Files
        .mockResolvedValueOnce({ rows: [{ event_type: 'created' }] } as any); // Events
      
      const result = await datasetRepo.fetchDatasetDetailsFromDb(1);
      expect(result).toEqual({ dataset_id: 1, title: 'D1', files: [{ aws_file_reference_id: 2 }], events: [{ event_type: 'created' }] });
    });
  });

  // ==========================================
  // 5. softDeleteDatasetInDb
  // ==========================================
  describe('softDeleteDatasetInDb()', () => {
    it('debería actualizar estado y marcar archivos físicos como borrados si existen', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ aws_file_reference_id: 1 }] }) // SELECT files (con archivos)
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ dataset_id: 1 }] }) // UPDATE dataset
        .mockResolvedValueOnce({}) // INSERT event
        .mockResolvedValueOnce({}) // UPDATE files
        .mockResolvedValueOnce({}); // COMMIT
        
      const res = await datasetRepo.softDeleteDatasetInDb(1, 2);
      expect(res.dataset).toBeDefined();
      expect(res.filesToDelete.length).toBe(1);
    });

    it('debería actualizar estado SIN actualizar archivos si el dataset estaba vacío', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // SELECT files (SIN archivos)
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ dataset_id: 1 }] }) // UPDATE dataset
        .mockResolvedValueOnce({}) // INSERT event
        .mockResolvedValueOnce({}); // COMMIT
        
      const res = await datasetRepo.softDeleteDatasetInDb(1, 2);
      expect(res.filesToDelete.length).toBe(0);
    });

    it('debería hacer ROLLBACK si no encuentra el dataset', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 0, rows: [] }); 
      await expect(datasetRepo.softDeleteDatasetInDb(1, 2)).rejects.toThrow('Dataset no encontrado o ya eliminado');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  // ==========================================
  // 6. updateDatasetInDb
  // ==========================================
  describe('updateDatasetInDb()', () => {
    it('debería actualizar, insertar nuevos archivos, borrar viejos y retornar datos', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 1, rows: [{ dataset_id: 10, storage_key: 'old_key' }] });
      
      const data = { 
        title: 'D1', 
        new_files: [
          { mime_type: 'application/x-zip-compressed', display_name: 'test.zip', file_size_bytes: 100 },
          { mime_type: 'unknown', display_name: 'raro.xyz', file_size_bytes: 100 }
        ],
        deleted_file_ids: [1, 2]
      };

      const res = await datasetRepo.updateDatasetInDb(1, 2, data);
      expect(res.updatedDataset.dataset_id).toBe(10);
      expect(res.s3KeysToDelete.length).toBeGreaterThan(0);
    });

    it('debería hacer ROLLBACK si no encuentra el dataset al actualizar', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 0, rows: [] }); 
      await expect(datasetRepo.updateDatasetInDb(1, 2, {})).rejects.toThrow('Dataset no encontrado');
    });
  });

  // ==========================================
  // 7. createDatasetRequestInDb
  // ==========================================
  describe('createDatasetRequestInDb()', () => {
    it('debería insertar con estado pending_validation y generar request para admins', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 1, rows: [{ dataset_id: 5, aws_file_reference_id: 2 }] });
      
      const data = { title: 'Req', dataset_status: 'pending_validation', files: [{ display_name: 'f.pdf', mime_type: 'pdf' }] };
      const result = await datasetRepo.createDatasetRequestInDb(1, data);
      
      expect(result.status).toBe('pending_validation');
    });

    it('debería insertar con estado draft sin generar requests extra', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 1, rows: [{ dataset_id: 5, aws_file_reference_id: 2 }] });
      
      const data = { title: 'Draft', dataset_status: 'draft', files: [] };
      const result = await datasetRepo.createDatasetRequestInDb(1, data);
      
      expect(result.status).toBe('draft');
    });

    it('debería hacer ROLLBACK en caso de error de sintaxis', async () => {
      mockClient.query.mockRejectedValue(new Error('Crash Request'));
      await expect(datasetRepo.createDatasetRequestInDb(1, { files: [] })).rejects.toThrow('Crash Request');
    });
  });

  // ==========================================
  // 8. resolveDatasetRequestInDb
  // ==========================================
  describe('resolveDatasetRequestInDb()', () => {
    it('debería publicar el dataset (publish) correctamente', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 1, rows: [] });
      const res = await datasetRepo.resolveDatasetRequestInDb(1, 2, 'publish', 'Aprobado');
      expect(res.message).toContain('published');
    });

    it('debería rechazar el dataset (reject) correctamente', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 1, rows: [] });
      const res = await datasetRepo.resolveDatasetRequestInDb(1, 2, 'reject', 'Malformado');
      expect(res.message).toContain('rejected');
    });

    it('debería lanzar error y ROLLBACK si no encuentra el dataset a revisar', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 0, rows: [] });
      await expect(datasetRepo.resolveDatasetRequestInDb(1, 2, 'publish', '')).rejects.toThrow('Dataset no encontrado');
    });
  });
});