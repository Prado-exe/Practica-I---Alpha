import { describe, it, expect, vi, beforeEach } from 'vitest';
<<<<<<< HEAD
import {
  getDatasetsAction,
  createDatasetAction,
  getDatasetByIdAction,
  deleteDatasetAction,
  updateDatasetAction
} from '@/routes/datasets.routes';
=======
import { getDatasetsAction, createDatasetAction } from '@/routes/datasets.routes';
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
import * as datasetsService from '@/services/datasets.service';
import * as jsonUtils from '@/utils/json';
import * as bodyUtils from '@/utils/body';
import * as authRoutes from '@/routes/auth.routes';
<<<<<<< HEAD
import * as authUtils from '@/utils/auth';

// 1. Mocks de todas las dependencias
=======

>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
vi.mock('@/services/datasets.service');
vi.mock('@/utils/json');
vi.mock('@/utils/body');
vi.mock('@/routes/auth.routes');
<<<<<<< HEAD
vi.mock('@/utils/auth');

describe('Datasets Routes - Cobertura 100%', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();
    res = {}; // Objeto response mockeado
    // Objeto request base
    req = {
      url: '/api/datasets',
      headers: { host: 'localhost' },
      user: { sub: '1', permissions: [] },
      params: {}
    };
  });

  // ==========================================
  // TEST: getDatasetsAction (Leer lista)
  // ==========================================
  describe('getDatasetsAction()', () => {
    it('debería responder 200 y asignar isAdmin=true si tiene permiso data_management.read', async () => {
      req.user.permissions = ['data_management.read'];
      req.url = '/api/datasets?search=test&page=2&limit=5';
      
      vi.mocked(datasetsService.getDatasets).mockResolvedValue({ total: 10, data: [] } as any);

      await getDatasetsAction(req, res);

      // Verifica que extrae la paginación de la URL y pasa isAdmin en true
      expect(datasetsService.getDatasets).toHaveBeenCalledWith(1, true, 'test', 2, 5);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, expect.objectContaining({ ok: true }));
    });

    it('debería responder 200, usar paginación por defecto y asignar isAdmin=false sin permisos', async () => {
      req.user.permissions = [];
      req.url = ''; // Test fallback de URL vacía
=======

describe('Datasets Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDatasetsAction()', () => {
    it('debería responder 200 con datos para un Administrador', async () => {
      // Simulamos req con permisos de admin
      const req = {
        user: { sub: '1', permissions: ['admin_general.manage'] },
        url: '/api/datasets?search=test&page=1&limit=5',
        headers: { host: 'localhost' }
      } as any;
      const res = {} as any;

      vi.mocked(datasetsService.getDatasets).mockResolvedValue({ total: 1, data: [] } as any);

      await getDatasetsAction(req, res);

      // Verificamos que se llamó al servicio con isAdmin = true
      expect(datasetsService.getDatasets).toHaveBeenCalledWith(1, true, 'test', 1, 5);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, expect.objectContaining({ ok: true }));
    });

    it('debería responder 200 para un Usuario normal (sin permisos de admin)', async () => {
      const req = {
        user: { sub: '2', permissions: [] },
        url: '', // Testeamos el fallback de URL vacía
        headers: {}
      } as any;
      const res = {} as any;
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas

      vi.mocked(datasetsService.getDatasets).mockResolvedValue({ total: 0, data: [] } as any);

      await getDatasetsAction(req, res);

<<<<<<< HEAD
      // Verifica valores por defecto: page 1, limit 10
      expect(datasetsService.getDatasets).toHaveBeenCalledWith(1, false, '', 1, 10);
    });

    it('debería capturar excepciones y responder con error', async () => {
      vi.mocked(datasetsService.getDatasets).mockRejectedValue(new Error('BD caída'));
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(500);

      await getDatasetsAction(req, res);

      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 500, expect.objectContaining({ ok: false }));
    });
  });

  // ==========================================
  // TEST: createDatasetAction (Crear borrador)
  // ==========================================
  describe('createDatasetAction()', () => {
    it('debería crear el dataset con isAdmin=true para rol super_admin y devolver 201', async () => {
      // Mockea el auth payload de tu nueva lógica
      vi.mocked(authUtils.tryGetAuthPayload).mockReturnValue({ sub: '1', role: 'super_admin' } as any);
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ title: 'New Dataset' });
      vi.mocked(datasetsService.createDataset).mockResolvedValue({ dataset_id: 100 } as any);

      await createDatasetAction(req, res);

      expect(datasetsService.createDataset).toHaveBeenCalledWith(1, true, { title: 'New Dataset' });
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 201, expect.objectContaining({
        message: "Dataset creado como borrador",
        ok: true
      }));
    });

    it('debería crear el dataset con isAdmin=false para rol normal', async () => {
      vi.mocked(authUtils.tryGetAuthPayload).mockReturnValue({ sub: '2', role: 'user' } as any);
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ title: 'User Dataset' });
      
      await createDatasetAction(req, res);

      expect(datasetsService.createDataset).toHaveBeenCalledWith(2, false, { title: 'User Dataset' });
    });

    it('debería manejar errores de lectura del body o Zod validation', async () => {
      vi.mocked(bodyUtils.readJsonBody).mockRejectedValue(new Error('Invalid JSON'));
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(400);

      await createDatasetAction(req, res);

      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, expect.objectContaining({ ok: false }));
    });
  });

  // ==========================================
  // TEST: getDatasetByIdAction (Revisar detalles)
  // ==========================================
  describe('getDatasetByIdAction()', () => {
    it('debería devolver 400 si el ID en los parámetros es inválido o texto', async () => {
      req.params.id = 'invalid_text'; //
      await getDatasetByIdAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, expect.objectContaining({ message: 'ID inválido' }));
    });

    it('debería devolver 200 y la data si el ID es válido', async () => {
      req.params.id = '10';
      vi.mocked(datasetsService.getDatasetById).mockResolvedValue({ title: 'Test Data' } as any);
      
      await getDatasetByIdAction(req, res);
      
      expect(datasetsService.getDatasetById).toHaveBeenCalledWith(10);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, expect.objectContaining({ ok: true, data: { title: 'Test Data' } }));
    });

    it('debería manejar errores si el servicio lanza excepción (ej. no encontrado)', async () => {
      req.params.id = '10';
      vi.mocked(datasetsService.getDatasetById).mockRejectedValue(new Error('Not found'));
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(404);
      
      await getDatasetByIdAction(req, res);
      
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 404, expect.objectContaining({ ok: false }));
    });
  });

  // ==========================================
  // TEST: deleteDatasetAction (Borrado Lógico)
  // ==========================================
  describe('deleteDatasetAction()', () => {
    it('debería devolver 400 si el ID es inválido', async () => {
      req.params.id = undefined; // ID faltante
      await deleteDatasetAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, expect.objectContaining({ message: 'ID inválido' }));
    });

    it('debería llamar a removeDataset y devolver 200', async () => {
      req.params.id = '15';
      vi.mocked(authUtils.tryGetAuthPayload).mockReturnValue({ sub: '5' } as any);
      vi.mocked(datasetsService.removeDataset).mockResolvedValue({ message: 'Dataset eliminado' } as any);
      
      await deleteDatasetAction(req, res);
      
      expect(datasetsService.removeDataset).toHaveBeenCalledWith(15, 5); // ID Dataset, ID Cuenta
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, expect.objectContaining({ message: 'Dataset eliminado' }));
    });

    it('debería capturar errores durante el borrado', async () => {
      req.params.id = '15';
      vi.mocked(authUtils.tryGetAuthPayload).mockReturnValue({ sub: '5' } as any);
      vi.mocked(datasetsService.removeDataset).mockRejectedValue(new Error('Fallo MinIO'));
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(500);

      await deleteDatasetAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 500, expect.objectContaining({ ok: false }));
    });
  });

  // ==========================================
  // TEST: updateDatasetAction (Editar)
  // ==========================================
  describe('updateDatasetAction()', () => {
    it('debería devolver 400 si el ID es inválido', async () => {
      req.params.id = 'NaN';
      await updateDatasetAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, expect.objectContaining({ message: 'ID inválido' }));
    });

    it('debería llamar a editDataset, enviar el body, y devolver 200', async () => {
      req.params.id = '20';
      const body = { title: 'Actualizado' };
      vi.mocked(authUtils.tryGetAuthPayload).mockReturnValue({ sub: '8' } as any);
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue(body);
      vi.mocked(datasetsService.editDataset).mockResolvedValue({ title: 'Actualizado' } as any);
      
      await updateDatasetAction(req, res);
      
      expect(datasetsService.editDataset).toHaveBeenCalledWith(20, 8, body); // ID Dataset, ID Cuenta, Datos
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, expect.objectContaining({ message: 'Dataset actualizado' }));
    });

    it('debería capturar errores durante la actualización', async () => {
      req.params.id = '20';
      vi.mocked(authUtils.tryGetAuthPayload).mockReturnValue({ sub: '8' } as any);
      vi.mocked(bodyUtils.readJsonBody).mockRejectedValue(new Error('Fallo body'));
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(500);

      await updateDatasetAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 500, expect.objectContaining({ ok: false }));
=======
      // Verificamos que isAdmin sea false y use valores por defecto (page 1, limit 10)
      expect(datasetsService.getDatasets).toHaveBeenCalledWith(2, false, '', 1, 10);
    });

    it('debería manejar errores en getDatasetsAction', async () => {
      const req = { user: { sub: '1' } } as any;
      const error = new Error('Fail');
      vi.mocked(datasetsService.getDatasets).mockRejectedValue(error);
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(500);

      await getDatasetsAction(req, {} as any);

      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 500, expect.objectContaining({ ok: false }));
    });
  });

  describe('createDatasetAction()', () => {
    it('debería responder 201 con mensaje de publicación directa para Admin', async () => {
      const req = {
        user: { sub: '1', permissions: ['admin_general.manage'] }
      } as any;
      const body = { name: 'New Dataset' };
      
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue(body);
      vi.mocked(datasetsService.createDataset).mockResolvedValue({ id: 100 } as any);

      await createDatasetAction(req, {} as any);

      expect(jsonUtils.sendJson).toHaveBeenCalledWith(
        expect.anything(), 
        201, 
        expect.objectContaining({ message: "Dataset publicado exitosamente" })
      );
    });

    it('debería responder 201 con mensaje de revisión para Usuario normal', async () => {
      const req = {
        user: { sub: '2', permissions: [] }
      } as any;
      
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({});
      vi.mocked(datasetsService.createDataset).mockResolvedValue({ id: 101 } as any);

      await createDatasetAction(req, {} as any);

      expect(jsonUtils.sendJson).toHaveBeenCalledWith(
        expect.anything(), 
        201, 
        expect.objectContaining({ message: "Solicitud de creación enviada a revisión" })
      );
    });

    it('debería manejar errores en createDatasetAction', async () => {
      const req = { user: { sub: '1' } } as any;
      vi.mocked(bodyUtils.readJsonBody).mockRejectedValue(new Error());
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(400);

      await createDatasetAction(req, {} as any);

      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 400, expect.anything());
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
    });
  });
});