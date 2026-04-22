import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyEmailAction, resendVerificationAction } from '@/routes/verify.routes';
import * as authService from '@/services/auth.service';
import * as jsonUtils from '@/utils/json';
import * as bodyUtils from '@/utils/body';
import * as authRoutes from '@/routes/auth.routes';
import { verifyCodeSchema, resendVerificationSchema } from '@/validators/auth.validators';
import { ZodError } from 'zod';

// ==========================================
// 1. MOCKS DE DEPENDENCIAS
// ==========================================
vi.mock('@/services/auth.service');
vi.mock('@/utils/json');
vi.mock('@/utils/body');
vi.mock('@/routes/auth.routes');

// Mockeamos los esquemas de Zod para forzar los escenarios de error de validación
vi.mock('@/validators/auth.validators', () => ({
  verifyCodeSchema: { parse: vi.fn() },
  resendVerificationSchema: { parse: vi.fn() }
}));

describe('Verify Routes - Cobertura 100%', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { headers: {} };
    res = {}; // Objeto response vacío para mock
  });

  // ==========================================
  // TEST: verifyEmailAction (Validar OTP)
  // ==========================================
  describe('verifyEmailAction()', () => {
    it('debería responder 200 con el resultado si el payload y el código son válidos', async () => {
      const mockPayload = { email: 'test@test.com', codigo: '123456' };
      const mockResult = { valid: true, message: 'Cuenta verificada correctamente' };

      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue(mockPayload);
      vi.mocked(verifyCodeSchema.parse).mockReturnValue(mockPayload as any);
      vi.mocked(authService.verifyEmailCode).mockResolvedValue(mockResult);

      await verifyEmailAction(req, res);

      // Verificamos el flujo de éxito
      expect(verifyCodeSchema.parse).toHaveBeenCalledWith(mockPayload);
      expect(authService.verifyEmailCode).toHaveBeenCalledWith(mockPayload);
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, mockResult);
    });

    it('debería capturar un ZodError y responder 400 con los detalles de validación', async () => {
      const zodError = new ZodError([{ message: 'Código inválido', path: ['codigo'] } as any]);
      
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({});
      // Forzamos a Zod a fallar
      vi.mocked(verifyCodeSchema.parse).mockImplementation(() => { throw zodError; });

      await verifyEmailAction(req, res);

      // Verificamos que se devuelva la estructura de validación
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, {
        valid: false,
        message: 'Datos inválidos',
        errors: zodError.issues
      });
    });

    it('debería capturar errores de negocio (AppError) y responder usando el manejador global', async () => {
      const appError = new Error('Código expirado');
      
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({});
      vi.mocked(verifyCodeSchema.parse).mockReturnValue({} as any);
      // Forzamos al servicio a fallar
      vi.mocked(authService.verifyEmailCode).mockRejectedValue(appError);
      
      // Simulamos la resolución de error global
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(400);
      vi.mocked(authRoutes.getErrorMessage).mockReturnValue('Código expirado');

      await verifyEmailAction(req, res);

      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, {
        valid: false,
        message: 'Código expirado'
      });
    });
  });

  // ==========================================
  // TEST: resendVerificationAction (Reenviar OTP)
  // ==========================================
  describe('resendVerificationAction()', () => {
    it('debería responder 200 con mensaje de éxito si el email es válido', async () => {
      const mockPayload = { email: 'test@test.com' };
      const mockResult = { message: 'Si el correo existe, se enviará un nuevo código.' };

      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue(mockPayload);
      vi.mocked(resendVerificationSchema.parse).mockReturnValue(mockPayload as any);
      vi.mocked(authService.resendVerificationCode).mockResolvedValue(mockResult as any);

      await resendVerificationAction(req, res);

      // Verificamos el flujo de éxito de reenvío
      expect(authService.resendVerificationCode).toHaveBeenCalledWith('test@test.com');
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, {
        ok: true,
        message: mockResult.message
      });
    });

    it('debería capturar un ZodError y responder 400 si el email es inválido', async () => {
      const zodError = new ZodError([{ message: 'Email inválido', path: ['email'] } as any]);
      
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({});
      // Forzamos a Zod a fallar en la validación de formato
      vi.mocked(resendVerificationSchema.parse).mockImplementation(() => { throw zodError; });

      await resendVerificationAction(req, res);

      // Verificamos la respuesta estandarizada de error de formato
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, {
        ok: false,
        message: 'Datos inválidos',
        errors: zodError.issues
      });
    });

    it('debería capturar errores de negocio (ej. Límite de reenvíos 429) y responder', async () => {
      const appError = new Error('Límite excedido');
      
      vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({});
      vi.mocked(resendVerificationSchema.parse).mockReturnValue({ email: 'a@a.com' } as any);
      // Simulamos que el servicio rechaza la petición por límite de uso
      vi.mocked(authService.resendVerificationCode).mockRejectedValue(appError);
      
      vi.mocked(authRoutes.getErrorStatus).mockReturnValue(429);
      vi.mocked(authRoutes.getErrorMessage).mockReturnValue('Límite excedido');

      await resendVerificationAction(req, res);

      // Verificamos que se propague el error y el status correspondiente
      expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 429, {
        ok: false,
        message: 'Límite excedido'
      });
    });
  });
});