import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pool } from '@/config/db';
import * as datasetRepo from '@/repositories/datasets.repository';

// 🛡️ EL MOCK DEL ENTORNO: Asegura que pase la validación de env.ts
vi.mock('@/config/env', () => ({
  env: {
    DB_USER: 'test', DB_PASSWORD: 'test', DB_HOST: 'localhost', DB_PORT: '5432', DB_NAME: 'test',
    JWT_SECRET: 'test', REFRESH_TOKEN_SECRET: 'test', FRONTEND_ORIGIN: 'test', S3_BUCKET_NAME: 'test'
  }
}));

// Mock de la Base de Datos
vi.mock('@/config/db', () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
}));

describe('Datasets Repository - Lógica de Acceso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchDatasetsPaginated()', () => {
    it('debería filtrar por owner_account_id cuando el usuario NO es admin', async () => {
      // 1️⃣ Simulamos la respuesta de la primera consulta (COUNT)
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ count: '10' }] } as any);
      
      // 2️⃣ Simulamos la respuesta de la segunda consulta (DATOS)
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);

      await datasetRepo.fetchDatasetsPaginated(99, false, '', 10, 0);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('d.owner_account_id = $1'),
        expect.arrayContaining([99])
      );
    });

    it('NO debería filtrar por dueño cuando el usuario ES admin', async () => {
      // 1️⃣ Simulamos la respuesta de la primera consulta (COUNT)
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ count: '5' }] } as any);
      
      // 2️⃣ Simulamos la respuesta de la segunda consulta (DATOS)
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);

      await datasetRepo.fetchDatasetsPaginated(99, true, '', 10, 0);

      // Verificamos la SEGUNDA llamada a la BD (que es la de los datos)
      const dataQuery = vi.mocked(pool.query).mock.calls[1][0];
      expect(dataQuery).not.toContain('d.owner_account_id =');
    });
  });

  describe('createFullDatasetInDb()', () => {
    it('debería insertar en dataset_requests si el creador no es admin', async () => {
      const mockClient = { query: vi.fn(), release: vi.fn() };
      vi.mocked(pool.connect).mockResolvedValue(mockClient as any);
      
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ dataset_id: 10 }] }) // INSERT DATASET
        .mockResolvedValueOnce({}) // INSERT REQUEST
        .mockResolvedValueOnce({}); // COMMIT

      await datasetRepo.createFullDatasetInDb(1, false, { title: 'T' });

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO dataset_requests'),
        expect.anything()
      );
    });
  });
});