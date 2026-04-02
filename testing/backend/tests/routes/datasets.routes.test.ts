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

describe('Datasets Routes - Lógica Sincronizada', () => {
  let req: any; let res: any;

  beforeEach(() => {
    vi.clearAllMocks();
    res = {};
    req = { url: '/api/datasets', headers: { host: 'localhost' }, user: { sub: '1', permissions: [] }, params: {} };
  });

  describe('getDatasetsAction()', () => {
    it('debería responder 200 y pasar los filtros extra', async () => {
      req.user.permissions = ['admin_general.manage'];
      req.url = '/api/datasets?search=test&page=1&limit=5';
      vi.mocked(datasetsService.getDatasets).mockResolvedValue({ total: 1, data: [] } as any);

      await getDatasetsAction(req, res);
      // Fíjate en el expect.anything() al final para atrapar el nuevo objeto de filtros {}
      expect(datasetsService.getDatasets).toHaveBeenCalledWith(1, expect.any(Boolean), 'test', 1, 5, expect.anything());
    });

    it('debería responder 200 con valores por defecto', async () => {
      req.user.sub = '2'; req.url = '';
      vi.mocked(datasetsService.getDatasets).mockResolvedValue({ total: 0, data: [] } as any);

      await getDatasetsAction(req, res);
      expect(datasetsService.getDatasets).toHaveBeenCalledWith(2, expect.any(Boolean), '', 1, 10, expect.anything());
    });
  });

  describe('createDatasetAction()', () => {
    it('debería responder 201 con los nuevos mensajes de creación', async () => {
      req.user.permissions = ['admin_general.manage'];
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ name: 'New' });
      vi.mocked(datasetsService.createDataset).mockResolvedValue({ id: 100 } as any);

      await createDatasetAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(
        res, 201, expect.objectContaining({ message: "Dataset creado como borrador", ok: true })
      );
    });
  });
});