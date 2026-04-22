import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getUsuariosAction, 
  toggleEstadoAction, 
  deleteUsuarioAction, 
  editUsuarioAction, 
  getRolesAction 
} from '@/routes/usuarios-admin.routes';
import * as authService from '@/services/auth.service';
import * as jsonUtils from '@/utils/json';
import * as bodyUtils from '@/utils/body';
import * as authRoutes from '@/routes/auth.routes';

// ==========================================
// 1. CONFIGURACIÓN DE MOCKS
// ==========================================
vi.mock('@/services/auth.service');
vi.mock('@/utils/json');
vi.mock('@/utils/body');
vi.mock('@/routes/auth.routes');

describe('Usuarios Admin Routes - Cobertura 100%', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();
    res = {}; // Mock del objeto respuesta
    req = { params: {}, headers: {} }; // Mock del objeto petición
    
    // Mocks por defecto para el manejador de errores
    vi.mocked(authRoutes.getErrorStatus).mockReturnValue(500);
    vi.mocked(authRoutes.getErrorMessage).mockReturnValue('Error');
  });

  // --------------------------------------------------------
  // TEST: getUsuariosAction
  // --------------------------------------------------------
  describe('getUsuariosAction()', () => {
    it('debería responder 200 con la lista de usuarios', async () => {
      const mockUsers = [{ id: 1, email: 'test@test.com' }];
      vi.mocked(authService.getAllUsers).mockResolvedValue(mockUsers as any);

      await getUsuariosAction(req, res);

      expect(authService.getAllUsers).toHaveBeenCalled();
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, { ok: true, usuarios: mockUsers });
    });

    it('debería manejar errores y responder con el status adecuado', async () => {
      vi.mocked(authService.getAllUsers).mockRejectedValue(new Error('Fail'));
      
      await getUsuariosAction(req, res);

      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 500, expect.objectContaining({ ok: false }));
    });
  });

  // --------------------------------------------------------
  // TEST: toggleEstadoAction
  // --------------------------------------------------------
  describe('toggleEstadoAction()', () => {
  it('debería fallar con 400 si no se proporciona el ID', async () => {
    req.params = {}; // Forzamos que no haya ID
    await toggleEstadoAction(req, res);
    
    // Usamos el string exacto para evitar problemas de comparación
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, { 
      ok: false, 
      message: "ID de usuario requerido" 
    });
  });

  it('debería manejar errores del servicio', async () => {
    req.params.id = '10';
    vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ estado: 'active' });
    
    // Simulamos que el servicio falla
    vi.mocked(authService.updateUserStatus).mockRejectedValue(new Error('Fail'));
    
    // Configuramos qué debe devolver el helper en este test
    vi.mocked(authRoutes.getErrorStatus).mockReturnValue(500);
    vi.mocked(authRoutes.getErrorMessage).mockReturnValue('Error');

    await toggleEstadoAction(req, res);

    // Corregimos la expectativa: debe ser 500 y el mensaje "Error"
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 500, { 
      ok: false, 
      message: "Error" 
    });
  });
});

  // --------------------------------------------------------
  // TEST: deleteUsuarioAction
  // --------------------------------------------------------
  describe('deleteUsuarioAction()', () => {
    it('debería fallar con 400 si falta el ID', async () => {
      req.params = {};
      await deleteUsuarioAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, expect.objectContaining({ ok: false }));
    });

    it('debería eliminar el usuario correctamente', async () => {
      req.params.id = '5';
      vi.mocked(authService.deleteUser).mockResolvedValue({ message: 'Borrado' });

      await deleteUsuarioAction(req, res);

      expect(authService.deleteUser).toHaveBeenCalledWith('5');
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, { ok: true, message: 'Borrado' });
    });

    it('debería manejar errores (ej: 403 superadmin)', async () => {
      req.params.id = '1';
      vi.mocked(authService.deleteUser).mockRejectedValue(new Error('Prohibido'));
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(403);

      await deleteUsuarioAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 403, expect.objectContaining({ ok: false }));
    });
  });

  // --------------------------------------------------------
  // TEST: editUsuarioAction
  // --------------------------------------------------------
  describe('editUsuarioAction()', () => {
    it('debería fallar con 400 si falta el ID', async () => {
      req.params = {};
      await editUsuarioAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, expect.objectContaining({ ok: false }));
    });

    it('debería fallar con 400 si no se envía role_code', async () => {
      req.params.id = '1';
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ full_name: 'N', email: 'e@e.com' } as any);
      
      await editUsuarioAction(req, res);
      
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, expect.objectContaining({ 
        message: expect.stringMatching(/rol es obligatorio/) 
      }));
    });

    it('debería editar el usuario exitosamente', async () => {
      req.params.id = '1';
      const mockBody = { full_name: 'Mati', email: 'm@m.com', role_code: 'admin', password: '123' };
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue(mockBody);
      vi.mocked(authService.editUserAdmin).mockResolvedValue({ message: 'Editado' });

      await editUsuarioAction(req, res);

      expect(authService.editUserAdmin).toHaveBeenCalledWith('1', 'Mati', 'm@m.com', 'admin', '123');
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, { ok: true, message: 'Editado' });
    });

    it('debería manejar errores de validación o servicio', async () => {
      req.params.id = '1';
      vi.mocked(bodyUtils.readJsonBody).mockRejectedValue(new Error('Body error'));
      
      await editUsuarioAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 500, expect.objectContaining({ ok: false }));
    });
  });

  // --------------------------------------------------------
  // TEST: getRolesAction
  // --------------------------------------------------------
  describe('getRolesAction()', () => {
    it('debería responder 200 con la lista de roles activos', async () => {
      const mockRoles = [{ id: 1, name: 'Admin' }];
      vi.mocked(authService.getActiveRoles).mockResolvedValue(mockRoles as any);

      await getRolesAction(req, res);

      expect(authService.getActiveRoles).toHaveBeenCalled();
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, { ok: true, roles: mockRoles });
    });

    it('debería manejar errores al obtener roles', async () => {
      vi.mocked(authService.getActiveRoles).mockRejectedValue(new Error());
      
      await getRolesAction(req, res);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 500, expect.objectContaining({ ok: false }));
    });
  });
});