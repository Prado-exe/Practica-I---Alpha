import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTagsForDropdown } from '@/services/tags.service';
import * as tagsRepo from '@/repositories/tags.repository';

// ==========================================
// 1. MOCKS DE DEPENDENCIAS
// ==========================================
// Simulamos el repositorio para aislar completamente el servicio
vi.mock('@/repositories/tags.repository', () => ({
  fetchAllTagsFromDb: vi.fn()
}));

// ==========================================
// 2. SUITE DE PRUEBAS - COBERTURA 100%
// ==========================================
describe('Tags Service - Cobertura 100%', () => {
  beforeEach(() => {
    // Limpiamos los mocks antes de cada prueba para mantener el aislamiento
    vi.clearAllMocks();
  });

  it('debería retornar la lista completa de etiquetas (tags) llamando al repositorio', async () => {
    // Simulamos que la base de datos devuelve un listado de etiquetas
    const mockTags = [
      { tag_id: 1, name: 'inteligencia artificial' },
      { tag_id: 2, name: 'cambio climático' },
      { tag_id: 3, name: 'salud pública' }
    ];
    vi.mocked(tagsRepo.fetchAllTagsFromDb).mockResolvedValue(mockTags as any);

    // Ejecutamos el servicio
    const result = await getTagsForDropdown();

    // Verificamos que se delegó la llamada al repositorio exactamente 1 vez
    expect(tagsRepo.fetchAllTagsFromDb).toHaveBeenCalledTimes(1);
    
    // Verificamos que la información regresó intacta al controlador
    expect(result).toEqual(mockTags);
  });

  it('debería propagar (burbujear) los errores lanzados por el repositorio', async () => {
    // Simulamos un fallo crítico al consultar la tabla de tags
    const dbError = new Error('Timeout al consultar la tabla de etiquetas');
    vi.mocked(tagsRepo.fetchAllTagsFromDb).mockRejectedValue(dbError);

    // Verificamos que el servicio NO atrape el error, permitiendo que suba al manejador global
    await expect(getTagsForDropdown()).rejects.toThrow('Timeout al consultar la tabla de etiquetas');
    
    // Comprobamos que el intento de consulta sí se realizó
    expect(tagsRepo.fetchAllTagsFromDb).toHaveBeenCalledTimes(1);
  });
});