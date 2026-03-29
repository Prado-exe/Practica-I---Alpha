import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllTagsAction } from '@/routes/tags.routes';
import * as tagsService from '@/services/tags.service';
import * as jsonUtils from '@/utils/json';
import * as authRoutes from '@/routes/auth.routes';

// ==========================================
// 1. CONFIGURACIÓN DE MOCKS
// ==========================================
vi.mock('@/services/tags.service');
vi.mock('@/utils/json');
vi.mock('@/routes/auth.routes');

describe('Tags Routes - Cobertura 100%', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {}; // Mock del objeto HttpRequest
    res = {}; // Mock del objeto HttpResponse
  });

  // --------------------------------------------------------
  // TEST: Flujo Exitoso (Líneas 65-68)
  // --------------------------------------------------------
  it('debería responder 200 con la lista de etiquetas cuando el servicio funciona', async () => {
    const mockTags = [
      { tag_id: 1, name: 'Tecnología' },
      { tag_id: 2, name: 'Ciencia' }
    ];
    
    // Simulamos que el servicio devuelve datos exitosamente
    vi.mocked(tagsService.getTagsForDropdown).mockResolvedValue(mockTags as any);

    await getAllTagsAction(req, res);

    // Verificamos que se llamó al servicio
    expect(tagsService.getTagsForDropdown).toHaveBeenCalledTimes(1);
    
    // Verificamos que se envió el JSON con status 200 y el formato correcto
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, {
      ok: true,
      data: mockTags
    });
  });

  // --------------------------------------------------------
  // TEST: Manejo de Errores (Líneas 69-70)
  // --------------------------------------------------------
  it('debería capturar errores del servicio y responder con el status de error global', async () => {
    const errorSimulado = new Error('Fallo de conexión');
    
    // Forzamos al servicio a lanzar una excepción
    vi.mocked(tagsService.getTagsForDropdown).mockRejectedValue(errorSimulado);
    
    // Mockeamos las utilidades de error de auth.routes
    vi.mocked(authRoutes.getErrorStatus).mockReturnValue(500);
    vi.mocked(authRoutes.getErrorMessage).mockReturnValue('Fallo de conexión');

    await getAllTagsAction(req, res);

    // Verificamos que se procesó el error a través de los helpers
    expect(authRoutes.getErrorStatus).toHaveBeenCalledWith(errorSimulado);
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 500, {
      ok: false,
      message: 'Fallo de conexión'
    });
  });
});