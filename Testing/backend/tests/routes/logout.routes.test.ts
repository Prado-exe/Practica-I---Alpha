import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logoutAction } from '@/routes/logout.routes';
import * as authService from '@/services/auth.service';
import * as cookieUtils from '@/utils/cookies';
import * as jsonUtils from '@/utils/json';
import * as authRoutes from '@/routes/auth.routes';

// Mockeamos las dependencias
vi.mock('@/services/auth.service');
vi.mock('@/utils/cookies');
vi.mock('@/utils/json');
vi.mock('@/routes/auth.routes');

describe('Logout Routes - Cobertura 100%', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería revocar la sesión, limpiar la cookie y responder 200 cuando hay sessionId', async () => {
    // 1. Arrange: Simulamos que existe una sesión activa
    vi.mocked(authRoutes.getSessionIdFromRequest).mockReturnValue('session_123');
    vi.mocked(authService.logoutUser).mockResolvedValue({ message: 'Sesión cerrada' } as any);

    const req = {} as any;
    const res = {} as any;

    // 2. Act
    await logoutAction(req, res);

    // 3. Assert
    expect(authRoutes.getSessionIdFromRequest).toHaveBeenCalledWith(req);
    expect(authService.logoutUser).toHaveBeenCalledWith('session_123');
    expect(cookieUtils.clearRefreshTokenCookie).toHaveBeenCalledWith(res);
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, {
      ok: true,
      message: "Sesión cerrada correctamente",
    });
  });

  it('debería limpiar la cookie y responder 200 aunque no haya sessionId', async () => {
    // 1. Arrange: Simulamos que no hay sesión en la petición
    vi.mocked(authRoutes.getSessionIdFromRequest).mockReturnValue(null);

    const req = {} as any;
    const res = {} as any;

    // 2. Act
    await logoutAction(req, res);

    // 3. Assert
    expect(authService.logoutUser).not.toHaveBeenCalled();
    expect(cookieUtils.clearRefreshTokenCookie).toHaveBeenCalledWith(res);
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, expect.anything());
  });

  it('debería manejar fallos internos de logoutUser silenciosamente y continuar con el cierre', async () => {
    // 1. Arrange: Forzamos un error en el servicio de logout
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(authRoutes.getSessionIdFromRequest).mockReturnValue('session_err');
    vi.mocked(authService.logoutUser).mockRejectedValue(new Error('Fallo en DB'));

    const req = {} as any;
    const res = {} as any;

    // 2. Act
    await logoutAction(req, res);

    // 3. Assert
    expect(warnSpy).toHaveBeenCalled(); // Verifica que se ejecutó el catch interno
    expect(cookieUtils.clearRefreshTokenCookie).toHaveBeenCalledWith(res);
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, expect.anything());
    
    warnSpy.mockRestore();
  });

  it('debería entrar al bloque catch externo ante un error crítico y asegurar el cierre de sesión', async () => {
    // 1. Arrange: Forzamos un error en la primera línea del try
    vi.mocked(authRoutes.getSessionIdFromRequest).mockImplementation(() => {
      throw new Error('Error fatal');
    });

    const req = {} as any;
    const res = {} as any;

    // 2. Act
    await logoutAction(req, res);

    // 3. Assert
    expect(cookieUtils.clearRefreshTokenCookie).toHaveBeenCalledWith(res);
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, {
      ok: true,
      message: "Sesión cerrada correctamente",
    });
  });
});