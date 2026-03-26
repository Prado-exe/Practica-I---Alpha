import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDatasetsAction, createDatasetAction } from '@/routes/datasets.routes';
import * as datasetsService from '@/services/datasets.service';
import * as jsonUtils from '@/utils/json';
import * as bodyUtils from '@/utils/body';
import * as authRoutes from '@/routes/auth.routes';

vi.mock('@/services/datasets.service');
vi.mock('@/utils/json');
vi.mock('@/utils/body');
vi.mock('@/routes/auth.routes');

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

      vi.mocked(datasetsService.getDatasets).mockResolvedValue({ total: 0, data: [] } as any);

      await getDatasetsAction(req, res);

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
    });
  });
});