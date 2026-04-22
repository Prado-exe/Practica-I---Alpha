import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as instRoutes from '@/routes/instituciones.routes';
import * as instService from '@/services/instituciones.service';
import * as jsonUtils from '@/utils/json';
import * as bodyUtils from '@/utils/body';
import * as authUtils from '@/utils/auth';
import * as authRoutes from '@/routes/auth.routes';

// Mock de todas las dependencias
vi.mock('@/services/instituciones.service');
vi.mock('@/utils/json');
vi.mock('@/utils/body');
vi.mock('@/utils/auth');
vi.mock('@/routes/auth.routes');

describe('Instituciones Routes - Cobertura 100%', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInstitucionesAction()', () => {
    it('debería responder 200 con la lista de instituciones', async () => {
      vi.mocked(instService.getInstitutions).mockResolvedValue([{ id: 1 }] as any);
      await instRoutes.getInstitucionesAction({} as any, {} as any);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 200, expect.objectContaining({ ok: true }));
    });

    it('debería manejar errores y responder con el status correspondiente', async () => {
      const error = new Error('Fail');
      vi.mocked(instService.getInstitutions).mockRejectedValue(error);
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(500);

      await instRoutes.getInstitucionesAction({} as any, {} as any);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 500, expect.anything());
    });
  });

  describe('createInstitucionAction()', () => {
    it('debería obtener el accountId del token y crear la institución con 201', async () => {
      vi.mocked(authUtils.tryGetAuthPayload).mockReturnValue({ sub: '10' } as any);
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ institution: {}, file: {} });
      vi.mocked(instService.addInstitution).mockResolvedValue({ id: 1 } as any);

      await instRoutes.createInstitucionAction({} as any, {} as any);

      expect(instService.addInstitution).toHaveBeenCalledWith(expect.anything(), expect.anything(), 10);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 201, expect.objectContaining({ message: "Institución creada" }));
    });

    it('debería entrar al catch si falla la creación', async () => {
      vi.mocked(authUtils.tryGetAuthPayload).mockReturnValue({ sub: '10' } as any);
      vi.mocked(bodyUtils.readJsonBody).mockRejectedValue(new Error());
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(400);

      await instRoutes.createInstitucionAction({} as any, {} as any);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 400, expect.anything());
    });
  });

  describe('updateInstitucionAction()', () => {
    it('debería validar ID y responder 400 si es inválido', async () => {
      const req = { params: { id: 'abc' } } as any;
      await instRoutes.updateInstitucionAction(req, {} as any);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 400, expect.objectContaining({ message: "ID inválido" }));
    });

    it('debería actualizar correctamente si el ID y body son válidos', async () => {
      const req = { params: { id: '1' } } as any;
      vi.mocked(authUtils.tryGetAuthPayload).mockReturnValue({ sub: '5' } as any);
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ institution: { name: 'New' }, file: null });
      
      await instRoutes.updateInstitucionAction(req, {} as any);

      expect(instService.editInstitution).toHaveBeenCalledWith(1, expect.anything(), null, 5);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 200, expect.objectContaining({ ok: true }));
    });

    it('debería manejar errores en el catch de actualización', async () => {
      const req = { params: { id: '1' } } as any;
      vi.mocked(authUtils.tryGetAuthPayload).mockImplementation(() => { throw new Error(); });
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(500);

      await instRoutes.updateInstitucionAction(req, {} as any);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 500, expect.anything());
    });
  });

  describe('deleteInstitucionAction()', () => {
    it('debería validar ID y responder 400 si falta', async () => {
      await instRoutes.deleteInstitucionAction({ params: {} } as any, {} as any);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 400, expect.anything());
    });

    it('debería llamar al servicio y responder 200 al eliminar', async () => {
      const req = { params: { id: '1' } } as any;
      vi.mocked(instService.removeInstitution).mockResolvedValue({ message: 'Eliminado' } as any);
      
      await instRoutes.deleteInstitucionAction(req, {} as any);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 200, expect.objectContaining({ ok: true }));
    });

    it('debería manejar errores en el catch de eliminación', async () => {
      vi.mocked(instService.removeInstitution).mockRejectedValue(new Error());
      await instRoutes.deleteInstitucionAction({ params: { id: '1' } } as any, {} as any);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), expect.any(Number), expect.anything());
    });
  });

  describe('getPublicInstitucionesAction()', () => {
    it('debería parsear parámetros de la URL y usar valores por defecto', async () => {
      const req = { 
        url: '/api/public?search=test', 
        headers: { host: 'localhost' } 
      } as any;
      
      vi.mocked(instService.getPublicInstitutions).mockResolvedValue({ total: 10, totalPages: 2, data: [] });

      await instRoutes.getPublicInstitucionesAction(req, {} as any);

      // Verificamos que usó los valores por defecto: page 1 y limit 9
      expect(instService.getPublicInstitutions).toHaveBeenCalledWith('test', 1, 9);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 200, expect.objectContaining({ total: 10 }));
    });

    it('debería parsear parámetros numéricos explícitos', async () => {
      const req = { 
        url: '/api/public?search=salud&page=3&limit=5', 
        headers: { host: 'localhost' } 
      } as any;
      
      await instRoutes.getPublicInstitucionesAction(req, {} as any);
      expect(instService.getPublicInstitutions).toHaveBeenCalledWith('salud', 3, 5);
    });

    it('debería manejar errores en la ruta pública', async () => {
      vi.mocked(instService.getPublicInstitutions).mockRejectedValue(new Error());
      await instRoutes.getPublicInstitucionesAction({} as any, {} as any);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), expect.any(Number), expect.anything());
    });
  });
});