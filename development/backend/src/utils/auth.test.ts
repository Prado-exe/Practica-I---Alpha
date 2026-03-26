import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth, tryGetAuthPayload } from './auth';
import * as jwtUtils from './jwt';
import * as authRepo from '../repositories/auth.repository';
import { AppError } from '../types/app-error';

// Mockeamos las dependencias
vi.mock('./jwt');
vi.mock('../repositories/auth.repository');

describe('Auth Utils - Cobertura 100%', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Silenciamos los console.warn/error para mantener limpia la terminal de tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('requireAuth()', () => {
    it('debería lanzar 401 si no hay header de autorización (Línea 17)', async () => {
      const req = { headers: {} } as any;
      await expect(requireAuth(req)).rejects.toThrow(new AppError("Token no proporcionado", 401));
    });

    it('debería soportar "Authorization" con mayúscula inicial (Línea 13)', async () => {
      const req = { headers: { Authorization: 'Bearer valid' } } as any;
      vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue({ sessionId: 1 } as any);
      vi.mocked(authRepo.findAuthSessionById).mockResolvedValue({ expires_at: new Date(Date.now() + 1000) } as any);
      vi.mocked(authRepo.findAccountByIdForSession).mockResolvedValue({ email_verified: true, account_status: 'active' } as any);

      await requireAuth(req);
      expect(jwtUtils.verifyAccessToken).toHaveBeenCalledWith('valid');
    });

    it('debería lanzar 401 si el token es inválido o expiró (Líneas 24-27)', async () => {
      const req = { headers: { authorization: 'Bearer bad-token' } } as any;
      vi.mocked(jwtUtils.verifyAccessToken).mockImplementation(() => { throw new Error(); });

      await expect(requireAuth(req)).rejects.toThrow("Token inválido o expirado");
    });

    it('debería lanzar 401 si la sesión no existe en la BD (Líneas 33-36)', async () => {
      const req = { headers: { authorization: 'Bearer token' } } as any;
      vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue({ sessionId: 123 } as any);
      vi.mocked(authRepo.findAuthSessionById).mockResolvedValue(null);

      await expect(requireAuth(req)).rejects.toThrow("Sesión no encontrada");
    });

    it('debería lanzar 401 si la sesión está revocada (Líneas 38-41)', async () => {
      const req = { headers: { authorization: 'Bearer token' } } as any;
      vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue({ sessionId: 1 } as any);
      vi.mocked(authRepo.findAuthSessionById).mockResolvedValue({ is_revoked: true } as any);

      await expect(requireAuth(req)).rejects.toThrow("Sesión revocada");
    });

    it('debería lanzar 401 si la sesión en BD ya expiró (Líneas 43-46)', async () => {
      const req = { headers: { authorization: 'Bearer token' } } as any;
      vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue({ sessionId: 1 } as any);
      vi.mocked(authRepo.findAuthSessionById).mockResolvedValue({ 
        expires_at: new Date(Date.now() - 1000), // Fecha pasada
        is_revoked: false 
      } as any);

      await expect(requireAuth(req)).rejects.toThrow("Sesión expirada");
    });

    it('debería lanzar 401 si la cuenta asociada no existe (Líneas 53-56)', async () => {
      const req = { headers: { authorization: 'Bearer token' } } as any;
      vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue({ sessionId: 1, sub: 10 } as any);
      vi.mocked(authRepo.findAuthSessionById).mockResolvedValue({ expires_at: new Date(Date.now() + 1000) } as any);
      vi.mocked(authRepo.findAccountByIdForSession).mockResolvedValue(null);

      await expect(requireAuth(req)).rejects.toThrow("Cuenta no encontrada");
    });

    it('debería lanzar 403 si la cuenta no está verificada o activa (Líneas 58-61)', async () => {
      const req = { headers: { authorization: 'Bearer token' } } as any;
      vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue({ sub: 1 } as any);
      vi.mocked(authRepo.findAuthSessionById).mockResolvedValue({ expires_at: new Date(Date.now() + 1000) } as any);
      vi.mocked(authRepo.findAccountByIdForSession).mockResolvedValue({ email_verified: false, account_status: 'active' } as any);

      await expect(requireAuth(req)).rejects.toThrow("La cuenta no está habilitada");
    });

    it('debería actualizar actividad y retornar payload en éxito (Líneas 64-68)', async () => {
      const req = { headers: { authorization: 'Bearer token' } } as any;
      const payload = { sub: 1, sessionId: 100 };
      vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue(payload as any);
      vi.mocked(authRepo.findAuthSessionById).mockResolvedValue({ session_id: 100, expires_at: new Date(Date.now() + 1000) } as any);
      vi.mocked(authRepo.findAccountByIdForSession).mockResolvedValue({ email_verified: true, account_status: 'active' } as any);

      const result = await requireAuth(req);

      expect(authRepo.updateAuthSessionLastUsed).toHaveBeenCalledWith(100);
      expect(result).toBe(payload);
    });
  });

  describe('tryGetAuthPayload()', () => {
    it('debería retornar null si no hay header o formato inválido (Línea 78)', () => {
      expect(tryGetAuthPayload({ headers: {} } as any)).toBeNull();
      expect(tryGetAuthPayload({ headers: { authorization: 'Basic 123' } } as any)).toBeNull();
    });

    it('debería retornar null si la verificación falla (Línea 87)', () => {
      vi.mocked(jwtUtils.verifyAccessToken).mockImplementation(() => { throw new Error(); });
      const req = { headers: { authorization: 'Bearer token' } } as any;
      expect(tryGetAuthPayload(req)).toBeNull();
    });

    it('debería retornar el payload si el token es válido (Línea 85)', () => {
      const payload = { sub: 1 };
      vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue(payload as any);
      const req = { headers: { authorization: 'Bearer token' } } as any;
      expect(tryGetAuthPayload(req)).toBe(payload);
    });
  });
});