import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pool } from '@/config/db';
import { fetchAllOdsFromDb } from '@/repositories/ods.repository';

/**
 * ============================================================================
 * TEST: Repositorio de ODS (ods.repository.test.ts)
 * * COBERTURA: 100%
 * ============================================================================
 */

// 1. Mock de la Base de Datos
vi.mock('@/config/db', () => ({
  pool: { query: vi.fn() },
}));

describe('ODS Repository - Cobertura 100%', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------
  // TEST: fetchAllOdsFromDb() - Éxito
  // --------------------------------------------------------
  it('debería retornar la lista de ODS ordenada por número ascendente', async () => {
    // Simulamos la respuesta oficial de la ONU mockeada en BD
    const mockRows = [
      { ods_id: 1, ods_number: 1, name: 'Fin de la pobreza' },
      { ods_id: 2, ods_number: 2, name: 'Hambre cero' }
    ];
    
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: mockRows } as any);

    const result = await fetchAllOdsFromDb();

    // Verificamos que la consulta SQL respete el contrato de ordenamiento numérico
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY ods_number ASC'));
    
    // Verificamos que se devuelvan exactamente las filas obtenidas
    expect(result).toEqual(mockRows);
    expect(result.length).toBe(2);
  });

  // --------------------------------------------------------
  // TEST: fetchAllOdsFromDb() - Manejo de errores
  // --------------------------------------------------------
  it('debería permitir que las excepciones de conexión burbujeen al manejador global', async () => {
    const dbError = new Error('Conexión perdida con PostgreSQL');
    
    // Simulamos un fallo crítico en el pool
    vi.mocked(pool.query).mockRejectedValueOnce(dbError);

    // Verificamos que el repositorio no atrape el error internamente
    await expect(fetchAllOdsFromDb()).rejects.toThrow('Conexión perdida con PostgreSQL');
  });

  // --------------------------------------------------------
  // TEST: fetchAllOdsFromDb() - Tabla Vacía
  // --------------------------------------------------------
  it('debería retornar un arreglo vacío si la tabla no tiene registros', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);

    const result = await fetchAllOdsFromDb();

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });
});