import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getRolesDetailsAction, 
  getPermisosAction, 
  createRoleAction, 
  updateRoleAction, 
  deleteRoleAction 
} from '@/routes/roles.routes';
import * as rolesService from '@/services/roles.service';
import * as jsonUtils from '@/utils/json';
import * as bodyUtils from '@/utils/body';
import * as authRoutes from '@/routes/auth.routes';

// 🛡️ MOCKS DE DEPENDENCIAS
vi.mock('@/services/roles.service');
vi.mock('@/utils/json');
vi.mock('@/utils/body');
vi.mock('@/routes/auth.routes');

describe('Roles Routes - Cobertura Total (100%)', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();
    res = {}; // Mock del objeto de respuesta
    req = { params: {} }; // Mock del objeto de petición
  });

  // ==========================================
  // 1. GET ROLES DETAILS
  // ==========================================
  describe('getRolesDetailsAction()', () => {
    it('debería responder 200 con la lista analítica de roles', async () => {
      const mockRoles = [{ role_id: 1, code: 'admin' }];
      vi.mocked(rolesService.getRolesDetails).mockResolvedValue(mockRoles as any);
      
      await getRolesDetailsAction(req, res);
      
      expect(rolesService.getRolesDetails).toHaveBeenCalled();
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, expect.objectContaining({ ok: true, roles: mockRoles }));
    });

    it('debería capturar errores y retornar código de error gestionado', async () => {
      vi.mocked(rolesService.getRolesDetails).mockRejectedValue(new Error('Fallo DB'));
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(500);
      
      await getRolesDetailsAction(req, res);
      
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 500, expect.objectContaining({ ok: false }));
    });
  });

  // ==========================================
  // 2. GET PERMISOS
  // ==========================================
  describe('getPermisosAction()', () => {
    it('debería responder 200 con el diccionario de permisos', async () => {
      const mockPermisos = [{ permission_id: 1, code: 'read' }];
      vi.mocked(rolesService.getAllPermissions).mockResolvedValue(mockPermisos as any);
      
      await getPermisosAction(req, res);
      
      expect(rolesService.getAllPermissions).toHaveBeenCalled();
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, expect.objectContaining({ ok: true, permisos: mockPermisos }));
    });

    it('debería capturar errores y retornar código de error gestionado', async () => {
      vi.mocked(rolesService.getAllPermissions).mockRejectedValue(new Error('Fallo de Red'));
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(500);
      
      await getPermisosAction(req, res);
      
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 500, expect.objectContaining({ ok: false }));
    });
  });

  // ==========================================
  // 3. CREATE ROLE
  // ==========================================
  describe('createRoleAction()', () => {
    it('debería responder 201 junto con el ID del rol creado', async () => {
      const inputBody = { code: 'c', name: 'n', description: 'd', permisos: [1, 2] };
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue(inputBody);
      vi.mocked(rolesService.createNewRole).mockResolvedValue({ message: 'Creado', roleId: 10 });
      
      await createRoleAction(req, res);
      
      expect(rolesService.createNewRole).toHaveBeenCalledWith('c', 'n', 'd', [1, 2]);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 201, expect.objectContaining({ ok: true, message: 'Creado', roleId: 10 }));
    });

    it('debería capturar errores de validación de payload', async () => {
      vi.mocked(bodyUtils.readJsonBody).mockRejectedValue(new Error('JSON Invalido'));
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(400);
      
      await createRoleAction(req, res);
      
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, expect.objectContaining({ ok: false }));
    });
  });

  // ==========================================
  // 4. UPDATE ROLE
  // ==========================================
  describe('updateRoleAction()', () => {
    it('debería responder 400 (fail-fast) si el ID es undefined', async () => {
      req.params.id = undefined;
      await updateRoleAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, expect.objectContaining({ message: "ID de rol inválido o requerido" }));
    });

    it('debería responder 400 (fail-fast) si el ID no es numérico (NaN)', async () => {
      req.params.id = 'texto';
      await updateRoleAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, expect.objectContaining({ message: "ID de rol inválido o requerido" }));
    });

    it('debería responder 200 tras actualizar el rol exitosamente', async () => {
      req.params.id = '5';
      const inputBody = { code: 'c2', name: 'n2', description: 'd2', permisos: [3] };
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue(inputBody);
      vi.mocked(rolesService.updateExistingRole).mockResolvedValue({ message: 'Actualizado' });
      
      await updateRoleAction(req, res);
      
      expect(rolesService.updateExistingRole).toHaveBeenCalledWith(5, 'c2', 'n2', 'd2', [3]);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, expect.objectContaining({ ok: true, message: 'Actualizado' }));
    });

    it('debería capturar errores de servicio durante la edición', async () => {
      req.params.id = '5';
      vi.mocked(bodyUtils.readJsonBody).mockRejectedValue(new Error('Error body'));
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(500);
      
      await updateRoleAction(req, res);
      
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 500, expect.objectContaining({ ok: false }));
    });
  });

  // ==========================================
  // 5. DELETE ROLE
  // ==========================================
  describe('deleteRoleAction()', () => {
    it('debería responder 400 (fail-fast) si el ID es undefined', async () => {
      req.params.id = undefined;
      await deleteRoleAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, expect.objectContaining({ message: "ID de rol inválido o requerido" }));
    });

    it('debería responder 400 (fail-fast) si el ID no es numérico (NaN)', async () => {
      req.params.id = 'NaN';
      await deleteRoleAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, expect.objectContaining({ message: "ID de rol inválido o requerido" }));
    });

    it('debería responder 200 tras eliminar el rol correctamente', async () => {
      req.params.id = '8';
      vi.mocked(rolesService.removeRole).mockResolvedValue({ message: 'Eliminado' });
      
      await deleteRoleAction(req, res);
      
      expect(rolesService.removeRole).toHaveBeenCalledWith(8);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, expect.objectContaining({ ok: true, message: 'Eliminado' }));
    });

    it('debería capturar errores de servicio (ej. borrar roles restringidos)', async () => {
      req.params.id = '1';
      vi.mocked(rolesService.removeRole).mockRejectedValue(new Error('Prohibido'));
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(403);
      
      await deleteRoleAction(req, res);
      
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 403, expect.objectContaining({ ok: false }));
    });
  });
});