import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pool } from '@/config/db';
import { fetchAllCategoriesFromDb } from '@/repositories/categories.repository';

/**
 * ============================================================================
 * TEST: Repositorio de Categorías (categories.repository.test.ts)
 * * COBERTURA: 100%
 * ============================================================================
 */

// 1. Mock de la Base de Datos
vi.mock('@/config/db', () => ({
  pool: { query: vi.fn() },
}));

describe('Categories Repository - Cobertura 100%', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------
  // TEST: fetchAllCategoriesFromDb() - Éxito
  // --------------------------------------------------------
  it('debería retornar solo categorías activas y ordenadas por nombre', async () => {
    // Simulamos una respuesta exitosa de PostgreSQL
    const mockRows = [
      { category_id: 1, name: 'Salud' },
      { category_id: 2, name: 'Tecnología' }
    ];
    
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: mockRows } as any);

    const result = await fetchAllCategoriesFromDb();

    // Verificamos que la consulta SQL aplique el filtro de seguridad is_active
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE is_active = TRUE'));
    
    // Verificamos que se solicite el ordenamiento alfabético al motor SQL
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY name ASC'));
    
    // Verificamos que los datos devueltos coincidan con la BD
    expect(result).toEqual(mockRows);
    expect(result.length).toBe(2);
  });

  // --------------------------------------------------------
  // TEST: fetchAllCategoriesFromDb() - Manejo de errores
  // --------------------------------------------------------
  it('debería permitir que los errores de conexión burbujeen al manejador global', async () => {
    const dbError = new Error('Connection refused');
    
    // Simulamos un fallo crítico en la base de datos
    vi.mocked(pool.query).mockRejectedValueOnce(dbError);

    // Validamos que el repositorio no capture el error internamente
    await expect(fetchAllCategoriesFromDb()).rejects.toThrow('Connection refused');
  });

  // --------------------------------------------------------
  // TEST: fetchAllCategoriesFromDb() - Caso de tabla vacía
  // --------------------------------------------------------
  it('debería retornar un arreglo vacío si no hay categorías habilitadas', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);

    const result = await fetchAllCategoriesFromDb();

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });
});