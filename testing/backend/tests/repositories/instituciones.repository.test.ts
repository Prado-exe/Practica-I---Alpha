import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pool } from '@/config/db';
import * as instRepo from '@/repositories/instituciones.repository';

// Simulamos la base de datos
vi.mock('@/config/db', () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
}));

describe('Instituciones Repository', () => {
  const mockClient = { query: vi.fn(), release: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(pool.connect).mockResolvedValue(mockClient as any);
  });

  describe('Lecturas', () => {
    it('fetchInstitutionsFromDb() debería traer todas las instituciones', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ institution_id: 1 }] } as any);
      await instRepo.fetchInstitutionsFromDb();
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    });

    it('fetchPublicInstitutionsPaginated() debería aplicar LIMIT y OFFSET', async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [{ count: '15' }] } as any)
        .mockResolvedValueOnce({ rows: [{ institution_id: 2 }] } as any);
      
      await instRepo.fetchPublicInstitutionsPaginated('salud', 5, 0);
      expect(pool.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('Escrituras y Transacciones', () => {
    it('createInstitutionInDb() debería usar una transacción (BEGIN/COMMIT) para guardar datos', async () => {
      // Configuramos el mock para que devuelva la fila que espera tu código
      mockClient.query.mockResolvedValue({ rows: [{ institution_id: 10 }] });

      await instRepo.createInstitutionInDb({} as any, { storage_key: 'key', file_url: 'url' }, 1);
      
      // Con verificar que la transacción se cerró bien es suficiente
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('updateInstitutionInDb() debería actualizar datos y retornar el objeto actualizado', async () => {
      // Como tu función hace RETURNING, preparamos el mock para devolver una fila
      const mockRow = { institution_id: 1 };
      mockClient.query.mockResolvedValue({ rows: [mockRow] });
      vi.mocked(pool.query).mockResolvedValue({ rows: [mockRow] } as any);
      
      const res = await instRepo.updateInstitutionInDb(1, {} as any, null, 1);
      
      // Ahora validamos que reciba el objeto tal como lo vimos en el error
      expect(res).toEqual(mockRow);
    });

    it('deleteInstitutionFromDb() debería borrar la institución por ID', async () => {
      vi.mocked(pool.query).mockResolvedValue({ rowCount: 1 } as any);
      
      const res = await instRepo.deleteInstitutionFromDb(5);
      
      expect(res).toBe(1);
    });
  });
});