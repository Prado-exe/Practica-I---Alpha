import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllOdsAction } from '@/routes/ods.routes';
import * as odsService from '@/services/ods.service';
import * as jsonUtils from '@/utils/json';
import * as authRoutes from '@/routes/auth.routes';

// ==========================================
// 1. CONFIGURACIÓN DE MOCKS
// ==========================================
vi.mock('@/services/ods.service');
vi.mock('@/utils/json');
vi.mock('@/routes/auth.routes');

describe('ODS Routes - Cobertura 100%', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {}; // Mock del objeto HttpRequest
    res = {}; // Mock del objeto HttpResponse
  });

  // --------------------------------------------------------
  // TEST: Flujo Exitoso (Líneas 69-72)
  // --------------------------------------------------------
  it('debería responder 200 con la lista de ODS cuando el servicio funciona', async () => {
    const mockOds = [
      { ods_id: 1, ods_number: 1, name: 'Fin de la pobreza' },
      { ods_id: 2, ods_number: 2, name: 'Hambre cero' }
    ];
    
    // Simulamos que el servicio devuelve datos exitosamente
    vi.mocked(odsService.getOdsForDropdown).mockResolvedValue(mockOds as any);

    await getAllOdsAction(req, res);

    // Verificamos que se llamó al servicio correcto
    expect(odsService.getOdsForDropdown).toHaveBeenCalledTimes(1);
    
    // Verificamos que se envió el JSON con status 200 y el formato esperado
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, {
      ok: true,
      data: mockOds
    });
  });

  // --------------------------------------------------------
  // TEST: Manejo de Errores (Líneas 73-74)
  // --------------------------------------------------------
  it('debería capturar errores del servicio y responder con el status de error global', async () => {
    const errorSimulado = new Error('Error de base de datos');
    
    // Forzamos al servicio a lanzar una excepción
    vi.mocked(odsService.getOdsForDropdown).mockRejectedValue(errorSimulado);
    
    // Mockeamos las utilidades de error de auth.routes
    vi.mocked(authRoutes.getErrorStatus).mockReturnValue(500);
    vi.mocked(authRoutes.getErrorMessage).mockReturnValue('Error de base de datos');

    await getAllOdsAction(req, res);

    // Verificamos que se procesó el error a través de los helpers de auth.routes
    expect(authRoutes.getErrorStatus).toHaveBeenCalledWith(errorSimulado);
    expect(authRoutes.getErrorMessage).toHaveBeenCalledWith(errorSimulado);
    
    // Verificamos la respuesta de error estandarizada
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 500, {
      ok: false,
      message: 'Error de base de datos'
    });
  });
});