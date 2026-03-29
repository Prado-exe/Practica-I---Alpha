import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCategoriesForDropdown } from '@/services/categories.service';
import * as categoriesRepo from '@/repositories/categories.repository';

// ==========================================
// 1. MOCKS DE DEPENDENCIAS
// ==========================================
// Simulamos el repositorio para no tocar la base de datos real
vi.mock('@/repositories/categories.repository', () => ({
  fetchAllCategoriesFromDb: vi.fn()
}));

// ==========================================
// 2. SUITE DE PRUEBAS - COBERTURA 100%
// ==========================================
describe('Categories Service - Cobertura 100%', () => {
  beforeEach(() => {
    // Limpiamos los contadores de los mocks antes de cada prueba
    vi.clearAllMocks();
  });

  it('debería retornar la lista de categorías llamando al repositorio', async () => {
    // Simulamos que la base de datos devuelve dos categorías
    const mockCategories = [
      { category_id: 1, name: 'Salud' },
      { category_id: 2, name: 'Educación' }
    ];
    vi.mocked(categoriesRepo.fetchAllCategoriesFromDb).mockResolvedValue(mockCategories as any);

    // Ejecutamos el servicio
    const result = await getCategoriesForDropdown();

    // Verificamos que se llamó a la función de BD exactamente 1 vez
    expect(categoriesRepo.fetchAllCategoriesFromDb).toHaveBeenCalledTimes(1);
    
    // Verificamos que la información llegó intacta
    expect(result).toEqual(mockCategories);
  });

  it('debería propagar (burbujear) los errores lanzados por el repositorio', async () => {
    // Simulamos una caída de la base de datos
    const dbError = new Error('Error crítico de conexión a la base de datos');
    vi.mocked(categoriesRepo.fetchAllCategoriesFromDb).mockRejectedValue(dbError);

    // Verificamos que el servicio NO atrape el error, sino que lo lance hacia el controlador
    await expect(getCategoriesForDropdown()).rejects.toThrow('Error crítico de conexión a la base de datos');
    
    // Verificamos que sí intentó llamar a la base de datos
    expect(categoriesRepo.fetchAllCategoriesFromDb).toHaveBeenCalledTimes(1);
  });
});