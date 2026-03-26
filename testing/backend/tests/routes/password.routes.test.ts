import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestPasswordResetAction, resetPasswordAction } from '@/routes/password.routes';
import * as authService from '@/services/auth.service';
import * as bodyUtils from '@/utils/body';
import * as jsonUtils from '@/utils/json';
import * as authRoutes from '@/routes/auth.routes';

// Mockeamos todas las dependencias
vi.mock('@/services/auth.service');
vi.mock('@/utils/body');
vi.mock('@/utils/json');
vi.mock('@/routes/auth.routes');

describe('Password Routes - Cobertura 100%', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requestPasswordResetAction()', () => {
    it('debería responder 400 si el correo no es proporcionado (Línea 10-13)', async () => {
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ email: '' });
      
      await requestPasswordResetAction({} as any, {} as any);

      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 400, expect.objectContaining({
        message: "El correo es obligatorio"
      }));
    });

    it('debería responder 200 cuando el correo es válido y el servicio responde (Línea 15-17)', async () => {
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ email: 'test@test.com' });
      vi.mocked(authService.requestPasswordReset).mockResolvedValue({ message: 'Correo enviado' } as any);
      
      await requestPasswordResetAction({} as any, {} as any);

      expect(authService.requestPasswordReset).toHaveBeenCalledWith('test@test.com');
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 200, {
        ok: true,
        message: 'Correo enviado'
      });
    });

    it('debería manejar errores del servicio y entrar al catch (Línea 18-22)', async () => {
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ email: 't@t.com' });
      vi.mocked(authService.requestPasswordReset).mockRejectedValue(new Error());
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(500);

      await requestPasswordResetAction({} as any, {} as any);

      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 500, expect.objectContaining({ ok: false }));
    });
  });

  describe('resetPasswordAction()', () => {
    it('debería responder 400 si falta el token o la contraseña (Línea 34-37)', async () => {
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ token: '', password: '123' });
      
      await resetPasswordAction({} as any, {} as any);

      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 400, expect.objectContaining({
        message: "Faltan datos (token o contraseña)"
      }));
    });

    it('debería responder 400 si la contraseña tiene menos de 8 caracteres (Línea 39-42)', async () => {
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ token: 'abc', password: 'short' });
      
      await resetPasswordAction({} as any, {} as any);

      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 400, expect.objectContaining({
        message: "La contraseña debe tener al menos 8 caracteres"
      }));
    });

    it('debería responder 200 cuando los datos son válidos y el servicio tiene éxito (Línea 44-46)', async () => {
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ token: 'secure_token', password: 'Password123!' });
      vi.mocked(authService.executePasswordReset).mockResolvedValue({ message: 'Éxito' } as any);
      
      await resetPasswordAction({} as any, {} as any);

      expect(authService.executePasswordReset).toHaveBeenCalledWith('secure_token', 'Password123!');
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 200, {
        ok: true,
        message: 'Éxito'
      });
    });

    it('debería manejar errores en resetPasswordAction (Línea 47-51)', async () => {
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ token: 't', password: 'p12345678' });
      vi.mocked(authService.executePasswordReset).mockRejectedValue(new Error());
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(401);

      await resetPasswordAction({} as any, {} as any);

      expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 401, expect.anything());
    });
  });
});