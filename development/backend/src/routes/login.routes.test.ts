import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginAction } from './login.routes';
import * as bodyUtils from '../utils/body';
import * as jsonUtils from '../utils/json';
import * as cookieUtils from '../utils/cookies';
import * as authService from '../services/auth.service';
import * as authRoutes from './auth.routes';
import { loginSchema } from '../validators/auth.validators';

// Mockeamos todas las dependencias
vi.mock('../utils/body');
vi.mock('../utils/json');
vi.mock('../utils/cookies');
vi.mock('../services/auth.service');
vi.mock('../validators/auth.validators');
vi.mock('./auth.routes');

describe('Login Routes - Cobertura 100%', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería realizar un login exitoso, setear cookie y responder 200', async () => {
    // 1. Arrange
    const mockReq = {
      socket: { remoteAddress: '192.168.1.1' },
      headers: { 'user-agent': 'Vitest-Browser' }
    } as any;
    const mockBody = { email: 't@t.com', password: '123' };
    const mockResult = {
      message: 'OK',
      accessToken: 'access',
      refreshToken: 'refresh',
      account: { id: 1 },
      accessExpiresAt: new Date()
    };

    vi.mocked(bodyUtils.readJsonBody).mockResolvedValue(mockBody);
    vi.mocked(loginSchema.parse).mockReturnValue(mockBody);
    vi.mocked(authService.loginUser).mockResolvedValue(mockResult as any);

    // 2. Act
    await loginAction(mockReq, {} as any);

    // 3. Assert
    expect(authService.loginUser).toHaveBeenCalledWith(mockBody, {
      ipAddress: '192.168.1.1',
      userAgent: 'Vitest-Browser'
    });
    expect(cookieUtils.setRefreshTokenCookie).toHaveBeenCalledWith(expect.anything(), 'refresh');
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 200, expect.objectContaining({ ok: true }));
  });

  it('debería responder 403 si el servicio indica que requiere revalidación', async () => {
    // Arrange
    vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ email: 't@t.com', password: '123' });
    // 👇 Cambiamos {} por un objeto válido para satisfacer a TypeScript
    vi.mocked(loginSchema.parse).mockReturnValue({ email: 't@t.com', password: '123' });
    vi.mocked(authService.loginUser).mockResolvedValue({
      requiresRevalidation: true,
      message: 'Revalidar cuenta'
    } as any);

    // Act
    await loginAction({ socket: {}, headers: {} } as any, {} as any);

    // Assert
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 403, expect.objectContaining({
      requiresRevalidation: true,
      message: 'Revalidar cuenta'
    }));
  });

  it('debería manejar fallos de IP/UserAgent usando "unknown"', async () => {
    // Arrange
    const mockReq = { socket: {}, headers: {} } as any;
    vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ email: 't@t.com', password: '123' });
    // 👇 Cambiamos {} por un objeto válido
    vi.mocked(loginSchema.parse).mockReturnValue({ email: 't@t.com', password: '123' });
    vi.mocked(authService.loginUser).mockResolvedValue({ message: 'OK' } as any);

    // Act
    await loginAction(mockReq, {} as any);

    // Assert
    expect(authService.loginUser).toHaveBeenCalledWith(expect.anything(), {
      ipAddress: 'unknown',
      userAgent: 'unknown'
    });
  });

  it('debería no setear cookie si el servicio no devuelve refreshToken', async () => {
    vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ email: 't@t.com', password: '123' });
    // 👇 Cambiamos {} por un objeto válido
    vi.mocked(loginSchema.parse).mockReturnValue({ email: 't@t.com', password: '123' });
    vi.mocked(authService.loginUser).mockResolvedValue({ message: 'OK', refreshToken: null } as any);

    await loginAction({ socket: {}, headers: {} } as any, {} as any);

    expect(cookieUtils.setRefreshTokenCookie).not.toHaveBeenCalled();
  });

  it('debería entrar al catch y responder error si algo falla', async () => {
    // Arrange
    const error = new Error('Zod Validation Fail');
    vi.mocked(bodyUtils.readJsonBody).mockRejectedValue(error);
    vi.mocked(authRoutes.getErrorStatus).mockReturnValue(400);
    vi.mocked(authRoutes.getErrorMessage).mockReturnValue('Error de validación');

    // Act
    await loginAction({} as any, {} as any);

    // Assert
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 400, {
      ok: false,
      message: 'Error de validación'
    });
  });
});