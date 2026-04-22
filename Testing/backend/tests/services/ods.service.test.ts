import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOdsForDropdown } from '@/services/ods.service';
import * as odsRepo from '@/repositories/ods.repository';

// ==========================================
// 1. MOCKS DE DEPENDENCIAS
// ==========================================
// Simulamos el repositorio para aislar el servicio
vi.mock('@/repositories/ods.repository', () => ({
  fetchAllOdsFromDb: vi.fn()
}));

// ==========================================
// 2. SUITE DE PRUEBAS - COBERTURA 100%
// ==========================================
describe('ODS Service - Cobertura 100%', () => {
  beforeEach(() => {
    // Limpiamos los mocks antes de cada prueba para evitar que se mezclen
    vi.clearAllMocks();
  });

  it('debería retornar la lista completa de ODS llamando al repositorio', async () => {
    // Simulamos que la base de datos devuelve un par de ODS
    const mockOds = [
      { ods_objective_id: 1, name: 'Fin de la pobreza' },
      { ods_objective_id: 2, name: 'Hambre cero' },
      { ods_objective_id: 3, name: 'Salud y bienestar' }
    ];
    vi.mocked(odsRepo.fetchAllOdsFromDb).mockResolvedValue(mockOds as any);

    // Ejecutamos el servicio
    const result = await getOdsForDropdown();

    // Verificamos que se llamó a la función de BD exactamente 1 vez
    expect(odsRepo.fetchAllOdsFromDb).toHaveBeenCalledTimes(1);
    
    // Verificamos que la información se devolvió intacta para el dropdown
    expect(result).toEqual(mockOds);
  });

  it('debería propagar (burbujear) los errores lanzados por el repositorio', async () => {
    // Simulamos un error interno de la base de datos
    const dbError = new Error('Error al conectar con la tabla de ODS');
    vi.mocked(odsRepo.fetchAllOdsFromDb).mockRejectedValue(dbError);

    // Verificamos que el servicio NO atrape el error internamente y lo lance hacia arriba
    await expect(getOdsForDropdown()).rejects.toThrow('Error al conectar con la tabla de ODS');
    
    // Verificamos que al menos sí intentó hacer la consulta
    expect(odsRepo.fetchAllOdsFromDb).toHaveBeenCalledTimes(1);
  });
});