import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pool } from '@/config/db';
import { fetchAllLicensesFromDb } from '@/repositories/licenses.repository';

/**
 * ============================================================================
 * TEST: Repositorio de Licencias (licenses.repository.test.ts)
 * * COBERTURA: 100%
 * ============================================================================
 */

// 1. Mock de la Base de Datos
vi.mock('@/config/db', () => ({
  pool: { query: vi.fn() },
}));

describe('Licenses Repository - Cobertura 100%', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------
  // TEST: fetchAllLicensesFromDb() - Éxito
  // --------------------------------------------------------
  it('debería retornar solo las licencias activas y ordenadas por nombre', async () => {
    // Simulamos una respuesta de BD con licencias estándar
    const mockRows = [
      { license_id: 1, name: 'Apache 2.0', code: 'Apache-2.0' },
      { license_id: 2, name: 'MIT', code: 'MIT' }
    ];
    
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: mockRows } as any);

    const result = await fetchAllLicensesFromDb();

    // Verificamos que la consulta SQL aplique el filtro de seguridad is_active
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE is_active = TRUE'));
    
    // Verificamos que se solicite el ordenamiento alfabético
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY name ASC'));
    
    // Verificamos la integridad de los datos devueltos
    expect(result).toEqual(mockRows);
    expect(result.length).toBe(2);
  });

  // --------------------------------------------------------
  // TEST: fetchAllLicensesFromDb() - Manejo de errores
  // --------------------------------------------------------
  it('debería permitir que los fallos de conectividad burbujeen al manejador global', async () => {
    const dbError = new Error('Database connection failed');
    
    // Simulamos un error en la capa de persistencia
    vi.mocked(pool.query).mockRejectedValueOnce(dbError);

    // Validamos que el repositorio no capture el error internamente
    await expect(fetchAllLicensesFromDb()).rejects.toThrow('Database connection failed');
  });

  // --------------------------------------------------------
  // TEST: fetchAllLicensesFromDb() - Caso sin resultados
  // --------------------------------------------------------
  it('debería retornar un arreglo vacío si no existen licencias habilitadas', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);

    const result = await fetchAllLicensesFromDb();

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });
});