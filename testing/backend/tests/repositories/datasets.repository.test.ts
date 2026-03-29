import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pool } from '@/config/db';
import * as datasetRepo from '@/repositories/datasets.repository';

// 🛡️ MOCK DEL ENTORNO
vi.mock('@/config/env', () => ({
  env: {
    DB_USER: 'test', DB_PASSWORD: 'test', DB_HOST: 'localhost', DB_PORT: '5432', DB_NAME: 'test',
    JWT_SECRET: 'test', REFRESH_TOKEN_SECRET: 'test', FRONTEND_ORIGIN: 'test', S3_BUCKET_NAME: 'test'
  }
}));

// 🛡️ MOCK DE LA BASE DE DATOS
vi.mock('@/config/db', () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
}));

describe('Datasets Repository - Cobertura 100%', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = { query: vi.fn(), release: vi.fn() };
    vi.mocked(pool.connect).mockResolvedValue(mockClient);
  });

  // ==========================================
  // 1. CREATE FULL DATASET (Transacciones y Archivos)
  // ==========================================
  describe('createFullDatasetInDb()', () => {
    it('debería crear el dataset, normalizar MIME types, extraer extensiones y hacer COMMIT', async () => {
      // Simulamos la cascada de transacciones
      mockClient.query
        .mockResolvedValueOnce({}) // 1. BEGIN
        .mockResolvedValueOnce({ rows: [{ dataset_id: 10 }] }) // 2. INSERT datasets
        // Archivo 1: Zip de Windows
        .mockResolvedValueOnce({ rows: [{ aws_file_reference_id: 100 }] }) // 3. INSERT aws_file_ref
        .mockResolvedValueOnce({}) // 4. INSERT dataset_files
        // Archivo 2: Archivo raro sin extensión válida
        .mockResolvedValueOnce({ rows: [{ aws_file_reference_id: 101 }] }) // 5. INSERT aws_file_ref
        .mockResolvedValueOnce({}) // 6. INSERT dataset_files
        .mockResolvedValueOnce({}); // 7. COMMIT

      const data = {
        title: 'Test',
        files: [
          { mime_type: 'application/x-zip-compressed', display_name: 'archivo.zip', storage_key: 'k1', file_url: 'u1', file_size_bytes: 10 },
          { mime_type: 'rare/type', display_name: 'archivo.bat', storage_key: 'k2', file_url: 'u2', file_size_bytes: 20 }
        ]
      };

      const result = await datasetRepo.createFullDatasetInDb(1, false, data);

      expect(result).toEqual({ dataset_id: 10, title: 'Test' });
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();

      // Verificar que el ZIP de Windows se normalizó a application/zip
      const awsInsertZip = mockClient.query.mock.calls[2];
      expect(awsInsertZip[1]).toContain('application/zip');

      // Verificar que el formato raro .bat se registró como txt (fallback)
      const dsFilesInsertBat = mockClient.query.mock.calls[5];
      expect(dsFilesInsertBat[1]).toContain('txt');
    });

    it('debería hacer ROLLBACK si ocurre un error en la BD', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('BD Offline'));

      await expect(datasetRepo.createFullDatasetInDb(1, false, { files: [] }))
        .rejects.toThrow('BD Offline');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  // ==========================================
  // 2. REGISTRO DE EVENTOS
  // ==========================================
  describe('recordDatasetEvent()', () => {
    it('debería insertar el evento correctamente', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({} as any);
      await datasetRepo.recordDatasetEvent({ dataset_id: 1, actor_account_id: 2, event_type: 'created', event_result: 'success', event_comment: 'OK' });
      
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO dataset_events'), 
        [1, 2, 'created', 'success', 'OK']
      );
    });
  });

  // ==========================================
  // 3. FETCH DATASETS (Paginación y Filtros)
  // ==========================================
  describe('fetchDatasetsPaginated()', () => {
    it('debería añadir filtro de búsqueda si se pasa el parámetro search', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ count: '5' }] } as any); // Count
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ dataset_id: 1 }] } as any); // Data

      const res = await datasetRepo.fetchDatasetsPaginated(1, true, 'keyword', 10, 0);
      
      expect(res.total).toBe(5);
      expect(res.data.length).toBe(1);

      const dataQuery = vi.mocked(pool.query).mock.calls[1][0];
      expect(dataQuery).toContain('ILIKE $1');
    });

    it('debería ejecutar la consulta base si no hay búsqueda', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ count: '2' }] } as any);
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);

      await datasetRepo.fetchDatasetsPaginated(1, false, '', 10, 0);
      
      const dataQuery = vi.mocked(pool.query).mock.calls[1][0];
      expect(dataQuery).not.toContain('ILIKE $1');
    });
  });

  // ==========================================
  // 4. FETCH DATASET DETAILS (Botón Revisar)
  // ==========================================
  describe('fetchDatasetDetailsFromDb()', () => {
    it('debería devolver null si el dataset no existe', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rowCount: 0 } as any);
      const res = await datasetRepo.fetchDatasetDetailsFromDb(999);
      expect(res).toBeNull();
    });

    it('debería devolver el dataset con sus archivos y eventos adjuntos', async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ dataset_id: 1, title: 'Test' }] } as any) // Dataset
        .mockResolvedValueOnce({ rows: [{ file_url: 'url' }] } as any) // Files
        .mockResolvedValueOnce({ rows: [{ event_type: 'created' }] } as any); // Events

      const res = await datasetRepo.fetchDatasetDetailsFromDb(1);
      
      expect(res).toEqual({ 
        dataset_id: 1, 
        title: 'Test', 
        files: [{ file_url: 'url' }], 
        events: [{ event_type: 'created' }] 
      });
    });
  });

  // ==========================================
  // 5. SOFT DELETE DATASET (Botón Eliminar)
  // ==========================================
  describe('softDeleteDatasetInDb()', () => {
    it('debería hacer UPDATE, registrar evento y devolver dataset', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ title: 'Deleted Data' }] }) // UPDATE
        .mockResolvedValueOnce({}) // INSERT event
        .mockResolvedValueOnce({}); // COMMIT

      const res = await datasetRepo.softDeleteDatasetInDb(1, 2);
      expect(res.title).toBe('Deleted Data');
    });

    it('debería lanzar error si no encuentra el dataset a eliminar', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 0 }); // UPDATE falló

      await expect(datasetRepo.softDeleteDatasetInDb(1, 2)).rejects.toThrow('Dataset no encontrado');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('debería hacer ROLLBACK si hay error interno', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('Crash'));
      await expect(datasetRepo.softDeleteDatasetInDb(1, 2)).rejects.toThrow('Crash');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  // ==========================================
  // 6. UPDATE DATASET (Botón Editar)
  // ==========================================
  describe('updateDatasetInDb()', () => {
    it('debería hacer UPDATE de datos, registrar evento y devolver dataset', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ dataset_id: 1 }] }) // UPDATE
        .mockResolvedValueOnce({}) // INSERT event
        .mockResolvedValueOnce({}); // COMMIT

      const res = await datasetRepo.updateDatasetInDb(1, 2, { title: 'D1' });
      expect(res.dataset_id).toBe(1);
    });

    it('debería lanzar error si no encuentra el dataset a editar', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 0 }); // UPDATE falló

      await expect(datasetRepo.updateDatasetInDb(1, 2, {})).rejects.toThrow('Dataset no encontrado');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('debería hacer ROLLBACK si hay error interno al editar', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('Crash Update'));
      await expect(datasetRepo.updateDatasetInDb(1, 2, {})).rejects.toThrow('Crash Update');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});