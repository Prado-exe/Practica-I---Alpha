import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getDatasetsAction, 
  createDatasetAction,
  getDatasetByIdAction,
  deleteDatasetAction,
  updateDatasetAction,
  getPublicDatasetsAction,
  getPublicDatasetByIdAction,
  requestDatasetAction
} from '@/routes/datasets.routes';
import * as datasetsService from '@/services/datasets.service';
import * as jsonUtils from '@/utils/json';
import * as bodyUtils from '@/utils/body';
import * as authRoutes from '@/routes/auth.routes';
import * as authUtils from '@/utils/auth';

// 🛡️ MOCKS DE DEPENDENCIAS
vi.mock('@/services/datasets.service');
vi.mock('@/utils/json');
vi.mock('@/utils/body');
vi.mock('@/routes/auth.routes');
vi.mock('@/utils/auth');

describe('Datasets Routes - Cobertura Sólida', () => {
  let req: any; 
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();
    res = {}; // Objeto response mockeado
    req = { 
      url: '/api/datasets', 
      headers: { host: 'localhost' }, 
      user: { sub: '1', permissions: [] }, 
      params: {} 
    };

    // Silenciamos los errores de consola esperados en los bloques catch
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // ==========================================
  // 1. GET DATASETS
  // ==========================================
  describe('getDatasetsAction()', () => {
    it('debería responder 200 y pasar los filtros extra si es admin', async () => {
      req.user.permissions = ['data_management.manage']; 
      req.url = '/api/datasets?search=test&page=1&limit=5';
      vi.mocked(datasetsService.getDatasets).mockResolvedValue({ total: 1, data: [] } as any);

      await getDatasetsAction(req, res);
      
      expect(datasetsService.getDatasets).toHaveBeenCalledWith(1, expect.any(Boolean), 'test', 1, 5, expect.anything());
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, expect.objectContaining({ ok: true }));
    });

    it('debería responder 200 con valores por defecto si la URL está vacía', async () => {
      req.user.sub = '2'; 
      req.url = '';
      vi.mocked(datasetsService.getDatasets).mockResolvedValue({ total: 0, data: [] } as any);

      await getDatasetsAction(req, res);
      expect(datasetsService.getDatasets).toHaveBeenCalledWith(2, expect.any(Boolean), '', 1, 10, expect.anything());
    });

    it('debería capturar errores y retornar código de error', async () => {
      vi.mocked(datasetsService.getDatasets).mockRejectedValue(new Error('DB Fallo'));
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(500);

      await getDatasetsAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 500, expect.objectContaining({ ok: false }));
    });
  });

  // ==========================================
  // 2. CREATE DATASET
  // ==========================================
  describe('createDatasetAction()', () => {
    it('debería responder 201 y crear el dataset como borrador', async () => {
      vi.mocked(authUtils.tryGetAuthPayload).mockReturnValue({ sub: '1', role: 'super_admin' } as any);
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ name: 'New' });
      vi.mocked(datasetsService.createDataset).mockResolvedValue({ id: 100 } as any);

      await createDatasetAction(req, res);
      
      expect(datasetsService.createDataset).toHaveBeenCalledWith(1, true, { name: 'New' });
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(
        res, 201, expect.objectContaining({ message: "Dataset creado como borrador", ok: true })
      );
    });

    it('debería capturar errores durante la creación', async () => {
      vi.mocked(authUtils.tryGetAuthPayload).mockReturnValue({ sub: '1' } as any);
      vi.mocked(bodyUtils.readJsonBody).mockRejectedValue(new Error('Invalid JSON'));
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(400);

      await createDatasetAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, expect.objectContaining({ ok: false }));
    });
  });

  // ==========================================
  // 3. GET DATASET BY ID
  // ==========================================
  describe('getDatasetByIdAction()', () => {
    it('debería responder 400 (fail-fast) si el ID es inválido', async () => {
      req.params.id = 'texto_invalido';
      await getDatasetByIdAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, expect.objectContaining({ message: 'ID inválido' }));
    });

    it('debería responder 200 con el dataset solicitado', async () => {
      req.params.id = '10';
      vi.mocked(datasetsService.getDatasetById).mockResolvedValue({ dataset_id: 10, title: 'Valid' } as any);
      
      await getDatasetByIdAction(req, res);
      
      expect(datasetsService.getDatasetById).toHaveBeenCalledWith(10);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, expect.objectContaining({ data: { dataset_id: 10, title: 'Valid' } }));
    });

    it('debería capturar errores si el dataset no existe', async () => {
      req.params.id = '99';
      vi.mocked(datasetsService.getDatasetById).mockRejectedValue(new Error('Not found'));
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(404);

      await getDatasetByIdAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 404, expect.objectContaining({ ok: false }));
    });
  });

  // ==========================================
  // 4. DELETE DATASET
  // ==========================================
  describe('deleteDatasetAction()', () => {
    it('debería responder 400 (fail-fast) si el ID es inválido', async () => {
      req.params.id = undefined;
      await deleteDatasetAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, expect.objectContaining({ message: 'ID inválido' }));
    });

    it('debería responder 200 tras eliminar lógicamente el dataset', async () => {
      req.params.id = '5';
      vi.mocked(authUtils.tryGetAuthPayload).mockReturnValue({ sub: '1' } as any);
      vi.mocked(datasetsService.removeDataset).mockResolvedValue({ message: 'OK' } as any);

      await deleteDatasetAction(req, res);
      
      expect(datasetsService.removeDataset).toHaveBeenCalledWith(5, 1);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, expect.objectContaining({ message: 'OK' }));
    });

    it('debería capturar errores durante la eliminación', async () => {
      req.params.id = '5';
      vi.mocked(datasetsService.removeDataset).mockRejectedValue(new Error('Error'));
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(500);

      await deleteDatasetAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 500, expect.objectContaining({ ok: false }));
    });
  });

  // ==========================================
  // 5. UPDATE DATASET
  // ==========================================
  describe('updateDatasetAction()', () => {
    it('debería responder 400 (fail-fast) si el ID es inválido', async () => {
      req.params.id = 'NaN';
      await updateDatasetAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, expect.objectContaining({ message: 'ID inválido' }));
    });

    it('debería responder 200 tras actualizar el dataset', async () => {
      req.params.id = '8';
      vi.mocked(authUtils.tryGetAuthPayload).mockReturnValue({ sub: '2' } as any);
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ title: 'Edit' });
      vi.mocked(datasetsService.editDataset).mockResolvedValue({ title: 'Edit' } as any);

      await updateDatasetAction(req, res);

      expect(datasetsService.editDataset).toHaveBeenCalledWith(8, 2, { title: 'Edit' });
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, expect.objectContaining({ message: 'Dataset actualizado' }));
    });

    it('debería capturar errores durante la edición', async () => {
      req.params.id = '8';
      vi.mocked(datasetsService.editDataset).mockRejectedValue(new Error('Fallo'));
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(500);

      await updateDatasetAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 500, expect.objectContaining({ ok: false }));
    });
  });

  // ==========================================
  // 6. GET PUBLIC DATASETS
  // ==========================================
  describe('getPublicDatasetsAction()', () => {
    it('debería extraer filtros de URL y responder 200', async () => {
      req.url = '/api/public/datasets?search=abc&page=2&limit=20&categoria=1&licencia=2&etiqueta=3&ods=4';
      vi.mocked(datasetsService.getDatasets).mockResolvedValue({ total: 5, data: [] } as any);

      await getPublicDatasetsAction(req, res);

      expect(datasetsService.getDatasets).toHaveBeenCalledWith(0, false, 'abc', 2, 20, {
        categoria: '1', licencia: '2', etiqueta: '3', ods: '4'
      });
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, expect.objectContaining({ ok: true }));
    });

    it('debería capturar errores en el catálogo público y devolver 500 duro', async () => {
      req.url = '/api/public/datasets';
      vi.mocked(datasetsService.getDatasets).mockRejectedValue(new Error('Crash DB'));

      await getPublicDatasetsAction(req, res);

      expect(console.error).toHaveBeenCalled();
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 500, expect.objectContaining({ ok: false, message: 'Error interno del servidor' }));
    });
  });

  // ==========================================
  // 7. GET PUBLIC DATASET BY ID
  // ==========================================
  describe('getPublicDatasetByIdAction()', () => {
    it('debería responder 400 (fail-fast) si el ID es inválido', async () => {
      req.params.id = 'not_a_number';
      await getPublicDatasetByIdAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, expect.objectContaining({ message: 'ID de dataset inválido' }));
    });

    it('debería responder 200 con el dataset', async () => {
      req.params.id = '12';
      vi.mocked(datasetsService.getDatasetById).mockResolvedValue({ title: 'Public Data' } as any);

      await getPublicDatasetByIdAction(req, res);

      expect(datasetsService.getDatasetById).toHaveBeenCalledWith(12);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, expect.objectContaining({ data: { title: 'Public Data' } }));
    });

    it('debería capturar errores con un catch silencioso (solo consola)', async () => {
      req.params.id = '12';
      vi.mocked(datasetsService.getDatasetById).mockRejectedValue(new Error('No encontrado'));

      await getPublicDatasetByIdAction(req, res);
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ==========================================
  // 8. REQUEST DATASET ACTION
  // ==========================================
  describe('requestDatasetAction()', () => {
    it('debería procesar la solicitud y responder 201', async () => {
      vi.mocked(authUtils.tryGetAuthPayload).mockReturnValue({ sub: '3' } as any);
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ data: 'Request' });
      vi.mocked(datasetsService.submitDatasetRequest).mockResolvedValue({ id: 99 } as any);

      await requestDatasetAction(req, res);

      expect(datasetsService.submitDatasetRequest).toHaveBeenCalledWith(3, { data: 'Request' });
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 201, expect.objectContaining({ message: 'Dataset enviado exitosamente para validación' }));
    });

    it('debería capturar errores durante la solicitud', async () => {
      vi.mocked(bodyUtils.readJsonBody).mockRejectedValue(new Error('Fallo Payload'));
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(400);

      await requestDatasetAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, expect.objectContaining({ ok: false }));
    });
  });

});