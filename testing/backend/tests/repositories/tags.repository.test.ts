import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pool } from '@/config/db';
import { fetchAllTagsFromDb } from '@/repositories/tags.repository';

/**
 * ============================================================================
 * TEST: Repositorio de Etiquetas (tags.repository.test.ts)
 * * COBERTURA: 100%
 * ============================================================================
 */

// 1. Mock de la Base de Datos
vi.mock('@/config/db', () => ({
  pool: { query: vi.fn() },
}));

describe('Tags Repository - Cobertura 100%', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------
  // TEST: fetchAllTagsFromDb() - Éxito
  // --------------------------------------------------------
  it('debería retornar la lista de etiquetas ordenada alfabéticamente', async () => {
    // Simulamos una respuesta exitosa de PostgreSQL con datos ordenados
    const mockRows = [
      { tag_id: 1, name: 'Ciencia' },
      { tag_id: 2, name: 'Tecnología' }
    ];
    
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: mockRows } as any);

    const result = await fetchAllTagsFromDb();

    // Verificamos que la consulta SQL incluya el ordenamiento solicitado
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY name ASC'));
    
    // Verificamos que se devuelvan exactamente las filas de la BD
    expect(result).toEqual(mockRows);
    expect(result.length).toBe(2);
  });

  // --------------------------------------------------------
  // TEST: fetchAllTagsFromDb() - Error
  // --------------------------------------------------------
  it('debería propagar los errores de conexión o ejecución de la BD', async () => {
    const dbError = new Error('Fallo crítico en el pool de conexiones');
    
    // Simulamos un fallo en la base de datos
    vi.mocked(pool.query).mockRejectedValueOnce(dbError);

    // Verificamos que la excepción "burbujee" hacia arriba
    await expect(fetchAllTagsFromDb()).rejects.toThrow('Fallo crítico en el pool de conexiones');
  });

  it('debería retornar un arreglo vacío si no hay etiquetas en la tabla', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);

    const result = await fetchAllTagsFromDb();

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });
});