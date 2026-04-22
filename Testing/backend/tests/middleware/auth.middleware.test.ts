import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authMiddleware, requirePermission, requireLogin } from '@/middlewares/auth.middleware';
import * as authUtils from '@/utils/auth';
import * as jsonUtils from '@/utils/json';
import { AppError } from '@/types/app-error';

// Mockeamos las utilidades externas
vi.mock('@/utils/auth');
vi.mock('@/utils/json');

describe('Auth Middleware - Cobertura 100%', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authMiddleware()', () => {
    it('debería asignar el payload a req.user y retornar void en éxito', async () => {
      // Arrange
      const mockPayload = { sub: '1', email: 'test@test.com', permissions: ['read'] };
      vi.mocked(authUtils.requireAuth).mockResolvedValue(mockPayload as any);
      const req = {} as any;
      const res = {} as any;

      // Act
      const result = await authMiddleware(req, res);

      // Assert
      expect(req.user).toBe(mockPayload);
      expect(result).toBeUndefined();
    });

    it('debería responder con status de AppError cuando falla con error conocido', async () => {
      // Arrange
      const error = new AppError("Token expirado", 401);
      vi.mocked(authUtils.requireAuth).mockRejectedValue(error);
      const res = {} as any;

      // Act
      const result = await authMiddleware({} as any, res);

      // Assert
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 401, {
        ok: false,
        message: "Token expirado"
      });
      expect(result).toBe(true);
    });

    it('debería responder con 401 y mensaje por defecto ante errores genéricos', async () => {
      // Arrange
      vi.mocked(authUtils.requireAuth).mockRejectedValue(new Error("Fallo crítico"));
      const res = {} as any;

      // Act
      await authMiddleware({} as any, res);

      // Assert
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 401, {
        ok: false,
        message: "No autorizado"
      });
    });
  });

  describe('requirePermission()', () => {
    it('debería retornar true inmediatamente si authMiddleware falla', async () => {
      // Arrange
      vi.mocked(authUtils.requireAuth).mockRejectedValue(new AppError("No login", 401));
      const middleware = requirePermission('admin.access');
      const req = {} as any;
      const res = {} as any;

      // Act
      const result = await middleware(req, res);

      // Assert
      expect(result).toBe(true);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 401, expect.anything());
    });

    it('debería responder 403 si el usuario no tiene el permiso requerido', async () => {
      // Arrange
      vi.mocked(authUtils.requireAuth).mockResolvedValue({ permissions: ['user.read'] } as any);
      const middleware = requirePermission('admin.access');
      const req = {} as any;
      const res = {} as any;

      // Act
      const result = await middleware(req, res);

      // Assert
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 403, {
        ok: false,
        message: "Acceso denegado: Permisos insuficientes."
      });
      expect(result).toBe(true);
    });

    it('debería permitir el acceso (retornar void) si el usuario tiene el permiso', async () => {
      // Arrange
      vi.mocked(authUtils.requireAuth).mockResolvedValue({ permissions: ['admin.access'] } as any);
      const middleware = requirePermission('admin.access');
      const req = {} as any;
      const res = {} as any;

      // Act
      const result = await middleware(req, res);

      // Assert
      expect(result).toBeUndefined();
      expect(jsonUtils.sendJson).not.toHaveBeenCalledWith(expect.anything(), 403, expect.anything());
    });
  });

  describe('requireLogin()', () => {
    it('debería retornar true si el usuario no está autenticado', async () => {
      vi.mocked(authUtils.requireAuth).mockRejectedValue(new Error());
      const result = await requireLogin({} as any, {} as any);
      expect(result).toBe(true);
    });

    it('debería retornar void si el usuario está autenticado', async () => {
      vi.mocked(authUtils.requireAuth).mockResolvedValue({ sub: '1' } as any);
      const result = await requireLogin({} as any, {} as any);
      expect(result).toBeUndefined();
    });
  });
});