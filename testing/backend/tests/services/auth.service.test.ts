import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from '@/services/auth.service';
import * as authRepo from '@/repositories/auth.repository';
import * as passwordUtils from '@/utils/password';
import * as jwtUtils from '@/utils/jwt';
import * as mailerUtils from '@/utils/mailer';
import * as otpUtils from '@/utils/otp';
import * as tokenUtils from '@/utils/token';
import { AppError } from '@/types/app-error';
import { createHash } from 'crypto'; 

// ==========================================
// MOCKS GLOBALES
// ==========================================
vi.mock('@/repositories/auth.repository');
vi.mock('@/utils/password');
vi.mock('@/utils/jwt');
vi.mock('@/utils/mailer');
vi.mock('@/utils/otp');
vi.mock('@/utils/token');
vi.mock('@/config/env', () => ({
  env: { 
    REFRESH_TOKEN_EXPIRES_IN_MS: 1000, 
    ACCESS_TOKEN_EXPIRES_IN_MS: 1000, 
    FRONTEND_ORIGIN: 'http://localhost' 
  }
}));

describe('Auth Service - Cobertura 100%', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {}); // Silencia errores en consola durante tests
  });

  // ==========================================
  // FUNCIONES AUXILIARES
  // ==========================================
  describe('Funciones Auxiliares (Internas)', () => {
    it('mapPublicAccount debería transformar objetos con roles por defecto', () => {
      const input = { account_id: 1, username: 'u', email: 'e@e.com' };
      const res = authService.mapPublicAccount(input);
      expect(res.role).toBe('registered_user');
      expect(res.permissions).toEqual([]);
    });
  });

  // ==========================================
  // REGISTRO Y LOGIN
  // ==========================================
  describe('registerUser()', () => {
    it('debería registrar exitosamente (incluyendo máscara de email y username único)', async () => {
      vi.mocked(authRepo.findAccountByEmail).mockResolvedValue(null);
      vi.mocked(authRepo.findRoleIdByCode).mockResolvedValue(1);
      vi.mocked(authRepo.findAccountByUsername).mockResolvedValue(null);
      vi.mocked(authRepo.createAccount).mockResolvedValue({ account_id: 1, email: 'te@te.com' } as any);
      vi.mocked(otpUtils.generateOtpCode).mockReturnValue('123456');

      const res = await authService.registerUser({ email: 'te@te.com', password: '123', name: 'Test' } as any);
      expect(res.message).toContain('Cuenta creada');
      expect(authRepo.createVerificationCode).toHaveBeenCalledWith(expect.objectContaining({
        destinationMasked: 't*@te.com' 
      }));
    });

    it('debería fallar si no existe el rol base', async () => {
      vi.mocked(authRepo.findAccountByEmail).mockResolvedValue(null);
      vi.mocked(authRepo.findRoleIdByCode).mockResolvedValue(null);
      await expect(authService.registerUser({ email: 'a@a.com' } as any)).rejects.toThrow(AppError);
    });

    it('debería manejar múltiples colisiones de username antes de encontrar uno libre', async () => {
      vi.mocked(authRepo.findAccountByEmail).mockResolvedValue(null);
      vi.mocked(authRepo.findRoleIdByCode).mockResolvedValue(1);
      vi.mocked(authRepo.findAccountByUsername)
        .mockResolvedValueOnce({ username: 't' } as any)
        .mockResolvedValueOnce({ username: 't1' } as any)
        .mockResolvedValue(null);
      vi.mocked(authRepo.createAccount).mockResolvedValue({ account_id: 1, email: 't@t.com' } as any);

      await authService.registerUser({ email: 't@t.com', password: '123', name: 'M' } as any);
      expect(authRepo.createAccount).toHaveBeenCalledWith(expect.objectContaining({ username: 't2' }));
    });
  });

  describe('loginUser()', () => {
    it('debería detectar cuenta bloqueada por tiempo', async () => {
      const future = new Date(Date.now() + 10000);
      vi.mocked(authRepo.findAccountLoginByEmail).mockResolvedValue({ locked_until: future } as any);
      await expect(authService.loginUser({ email: 't@t.com', password: '1' })).rejects.toThrow(/bloqueada temporalmente/);
    });

    it('debería retornar requiresRevalidation si el estado es pending_revalidation', async () => {
      vi.mocked(authRepo.findAccountLoginByEmail).mockResolvedValue({ account_status: 'pending_revalidation', email: 't@t.com' } as any);
      const res = await authService.loginUser({ email: 't@t.com', password: '1' });
      expect(res).toHaveProperty('requiresRevalidation', true);
    });

    it('debería bloquear cuenta tras 10 intentos fallidos', async () => {
      vi.mocked(authRepo.findAccountLoginByEmail).mockResolvedValue({ account_id: 1, failed_login_count: 9 } as any);
      vi.mocked(passwordUtils.comparePassword).mockResolvedValue(false);
      
      await expect(authService.loginUser({ email: 't@t.com', password: 'w' })).rejects.toThrow(/bloqueada por 1 hora/);
      expect(authRepo.lockAccountUntil).toHaveBeenCalled();
    });

    it('debería activar "Trampa de Revalidación" si el usuario tenía un bloqueo previo (locked_until pasado)', async () => {
      const past = new Date(Date.now() - 10000);
      vi.mocked(authRepo.findAccountLoginByEmail).mockResolvedValue({ account_id: 1, locked_until: past, email: 't@t.com' } as any);
      vi.mocked(passwordUtils.comparePassword).mockResolvedValue(true);
      
      const res = await authService.loginUser({ email: 't@t.com', password: '1' });
      expect(res.message).toContain('revalidar su cuenta');
      expect(authRepo.updateAccountStatus).toHaveBeenCalledWith(1, 'pending_revalidation');
    });

    it('debería manejar fallo silencioso al enviar correo de revalidación', async () => {
      const past = new Date(Date.now() - 10000);
      vi.mocked(authRepo.findAccountLoginByEmail).mockResolvedValue({ account_id: 1, locked_until: past, email: 't@t.com' } as any);
      vi.mocked(passwordUtils.comparePassword).mockResolvedValue(true);
      vi.mocked(mailerUtils.sendVerificationEmail).mockRejectedValue(new Error('Fallo SMTP'));
      
      const res = await authService.loginUser({ email: 't@t.com', password: '1' });
      expect(res.requiresRevalidation).toBe(true); // El flujo continúa sin romper
    });

    it('debería fallar si la cuenta no está activa o verificada', async () => {
      vi.mocked(authRepo.findAccountLoginByEmail).mockResolvedValue({ account_status: 'inactive', email_verified: false } as any);
      vi.mocked(passwordUtils.comparePassword).mockResolvedValue(true);
      await expect(authService.loginUser({ email: 't@t.com', password: '1' })).rejects.toThrow(/verificar su correo/);
    });
  });

  // ==========================================
  // OTP, EMAILS Y SESIONES
  // ==========================================
  describe('verifyEmailCode()', () => {
    it('debería manejar éxito en revalidación tras bloqueo', async () => {
      vi.mocked(authRepo.findAccountBasicByEmail).mockResolvedValue({ account_id: 1, account_status: 'pending_revalidation' } as any);
      vi.mocked(authRepo.findLatestVerificationCodeByAccountId).mockResolvedValue({ code_hash: 'hash', expires_at: new Date(Date.now() + 1000) } as any);
      vi.mocked(otpUtils.hashOtpCode).mockReturnValue('hash');

      const res = await authService.verifyEmailCode({ email: 't@t.com', codigo: '123' });
      expect(res.message).toContain('desbloqueada con éxito');
      expect(authRepo.updateAccountStatus).toHaveBeenCalledWith(1, 'active');
    });

    it('debería retornar éxito inmediato si la cuenta ya está activa', async () => {
      vi.mocked(authRepo.findAccountBasicByEmail).mockResolvedValue({ account_id: 1, email_verified: true, account_status: 'active' } as any);
      const res = await authService.verifyEmailCode({ email: 't@t.com', codigo: '123' });
      expect(res.message).toContain('ya estaba verificada o activa');
    });

    it('debería fallar por código expirado o bloqueado', async () => {
      vi.mocked(authRepo.findAccountBasicByEmail).mockResolvedValue({ account_id: 1 } as any);
      vi.mocked(authRepo.findLatestVerificationCodeByAccountId).mockResolvedValue({ expires_at: new Date(Date.now() - 1000) } as any);
      await expect(authService.verifyEmailCode({ email: 't@t.com', codigo: '1' })).rejects.toThrow(/expirado/);
    });

    it('debería bloquear tras alcanzar máximo de intentos', async () => {
      vi.mocked(authRepo.findAccountBasicByEmail).mockResolvedValue({ account_id: 1 } as any);
      vi.mocked(authRepo.findLatestVerificationCodeByAccountId).mockResolvedValue({ 
        verification_code_id: 10, attempts_count: 5, max_attempts: 5, code_hash: 'h1', expires_at: new Date(Date.now() + 1000) 
      } as any);
      vi.mocked(otpUtils.hashOtpCode).mockReturnValue('h2'); 

      await expect(authService.verifyEmailCode({ email: 't@t.com', codigo: 'wrong' })).rejects.toThrow(/máximo de intentos/);
      expect(authRepo.blockVerificationCodeUntil).toHaveBeenCalled();
    });

    it('debería fallar si el código ya fue consumido o invalidado', async () => {
      vi.mocked(authRepo.findAccountBasicByEmail).mockResolvedValue({ account_id: 1 } as any);
      
      vi.mocked(authRepo.findLatestVerificationCodeByAccountId).mockResolvedValueOnce({ consumed_at: new Date() } as any);
      await expect(authService.verifyEmailCode({ email: 'a@a.com', codigo: '1' })).rejects.toThrow("Este código ya fue utilizado");

      vi.mocked(authRepo.findLatestVerificationCodeByAccountId).mockResolvedValueOnce({ invalidated_at: new Date() } as any);
      await expect(authService.verifyEmailCode({ email: 'a@a.com', codigo: '1' })).rejects.toThrow("El código ya no es válido");
    });
  });

  describe('resendVerificationCode()', () => {
    it('debería fallar si se pide demasiado pronto (< 60s)', async () => {
      vi.mocked(authRepo.findAccountBasicByEmail).mockResolvedValue({ account_id: 1 } as any);
      vi.mocked(authRepo.findLatestVerificationCodeByAccountId).mockResolvedValue({ last_sent_at: new Date() } as any);
      await expect(authService.resendVerificationCode('a@a.com')).rejects.toThrow(/60 segundos/);
    });

    it('debería bloquear al usuario si excede el límite de 3 reenvíos', async () => {
      vi.mocked(authRepo.findAccountBasicByEmail).mockResolvedValue({ account_id: 1, email: 'test@test.com' } as any);
      vi.mocked(authRepo.findLatestVerificationCodeByAccountId).mockResolvedValue({ 
        resend_count: 3, verification_code_id: 100 
      } as any);

      await expect(authService.resendVerificationCode('test@test.com')).rejects.toThrow("Se alcanzó el máximo de reenvíos permitidos");
      expect(authRepo.blockVerificationCodeUntil).toHaveBeenCalledWith(100, expect.any(Date));
    });

    it('debería retornar mensaje genérico si el usuario no existe', async () => {
      vi.mocked(authRepo.findAccountBasicByEmail).mockResolvedValue(null);
      const res = await authService.resendVerificationCode('noexiste@t.com');
      expect(res.message).toContain('se enviará un nuevo código');
    });
  });

  describe('logoutUser()', () => {
    it('debería lanzar 404 si la sesión no existe', async () => {
      vi.mocked(authRepo.findAuthSessionById).mockResolvedValue(null);
      await expect(authService.logoutUser(99)).rejects.toThrow(new AppError("Sesión no encontrada", 404));
    });

    it('debería omitir la revocación si la sesión ya está revocada', async () => {
      vi.mocked(authRepo.findAuthSessionById).mockResolvedValue({ is_revoked: true } as any);
      const res = await authService.logoutUser(1);
      expect(authRepo.revokeAuthSession).not.toHaveBeenCalled();
      expect(res.message).toBe("Sesión cerrada correctamente");
    });

    it('debería revocar la sesión si está activa', async () => {
      vi.mocked(authRepo.findAuthSessionById).mockResolvedValue({ is_revoked: false } as any);
      const res = await authService.logoutUser(1);
      expect(authRepo.revokeAuthSession).toHaveBeenCalledWith(1, "logout");
      expect(res.message).toBe("Sesión cerrada correctamente");
    });
  });

  describe('refreshUserSession()', () => {
    it('debería fallar si el token es inválido (falla jwt verify)', async () => {
      vi.mocked(jwtUtils.verifyRefreshToken).mockImplementation(() => { throw new Error("Invalid JWT"); });
      await expect(authService.refreshUserSession('bad_token')).rejects.toThrow("Refresh token inválido o expirado");
    });

    it('debería detectar rotación de token (reutilización)', async () => {
      vi.mocked(jwtUtils.verifyRefreshToken).mockReturnValue({ sessionId: 1, tokenId: 't1' } as any);
      vi.mocked(authRepo.findAuthSessionById).mockResolvedValue({ 
        current_refresh_token_id: 't1', refresh_token_hash: 'hash_viejo', is_revoked: false, expires_at: new Date(Date.now() + 1000) 
      } as any);
      vi.mocked(tokenUtils.generateSecureToken).mockReturnValue('hash_nuevo');

      await expect(authService.refreshUserSession('token_diferente')).rejects.toThrow(/reutilización/);
      expect(authRepo.revokeAuthSession).toHaveBeenCalled();
    });

    it('debería fallar si la cuenta ya no es activa durante el refresh', async () => {
      const fakeToken = 'valid_token';
      const fakeHash = createHash('sha256').update(fakeToken).digest('hex'); 
      
      vi.mocked(jwtUtils.verifyRefreshToken).mockReturnValue({ sessionId: 1, tokenId: 't1' } as any);
      vi.mocked(authRepo.findAuthSessionById).mockResolvedValue({ 
        session_id: 1, account_id: 10, current_refresh_token_id: 't1', refresh_token_hash: fakeHash, 
        is_revoked: false, expires_at: new Date(Date.now() + 100000) 
      } as any);
      vi.mocked(authRepo.findAccountByIdForSession).mockResolvedValue({ email_verified: true, account_status: 'suspended' } as any);

      await expect(authService.refreshUserSession(fakeToken)).rejects.toThrow(/La cuenta no está habilitada/);
    });
  });

  // ==========================================
  // RECUPERACIÓN DE CONTRASEÑA
  // ==========================================
  describe('Password Reset Logic', () => {
    it('requestPasswordReset debería enviar un correo si el usuario existe', async () => {
      vi.mocked(authRepo.findAccountBasicByEmail).mockResolvedValue({ account_id: 1, email: 't@t.com' } as any);
      vi.mocked(tokenUtils.generateSecureToken).mockReturnValue('token123');
      vi.mocked(tokenUtils.hashSecureToken).mockReturnValue('hash123');

      const res = await authService.requestPasswordReset('t@t.com');
      
      expect(authRepo.createPasswordResetToken).toHaveBeenCalledWith(1, 'hash123', expect.any(Date));
      expect(mailerUtils.sendPasswordResetEmail).toHaveBeenCalled();
      expect(res.message).toContain('Si el correo está registrado');
    });

    it('requestPasswordReset debería manejar el fallo al enviar el correo silenciosamente', async () => {
      vi.mocked(authRepo.findAccountBasicByEmail).mockResolvedValue({ account_id: 1, email: 't@t.com' } as any);
      vi.mocked(mailerUtils.sendPasswordResetEmail).mockRejectedValue(new Error('Fallo SMTP'));

      const res = await authService.requestPasswordReset('t@t.com');
      expect(res.message).toContain('Si el correo está registrado'); // El usuario no se entera
    });

    it('executePasswordReset debería actualizar password y revocar sesiones al tener éxito', async () => {
      vi.mocked(tokenUtils.hashSecureToken).mockReturnValue('hash_valido');
      vi.mocked(authRepo.findValidPasswordResetToken).mockResolvedValue({ account_id: 10, password_reset_token_id: 'token_id' } as any);
      vi.mocked(passwordUtils.hashPassword).mockResolvedValue('new_hash');

      const res = await authService.executePasswordReset('token_ok', 'NewPass123!');

      expect(authRepo.updateAccountPassword).toHaveBeenCalledWith(10, 'new_hash');
      expect(authRepo.consumePasswordResetToken).toHaveBeenCalledWith('token_id');
      expect(authRepo.revokeAllActiveSessionsByAccountId).toHaveBeenCalledWith(10, 'password_reset');
      expect(res.message).toContain('Contraseña actualizada');
    });
  });

  // ==========================================
  // PANEL ADMINISTRADOR (CRUD Usuarios y Roles)
  // ==========================================
  describe('Panel Admin', () => {
    it('getAllUsers debería retornar la lista completa de usuarios', async () => {
      const mockUsers = [{ account_id: 1, email: 'test@test.com' }];
      vi.mocked(authRepo.fetchAllUsersFromDb).mockResolvedValue(mockUsers as any);

      const res = await authService.getAllUsers();
      expect(res).toEqual(mockUsers);
      expect(authRepo.fetchAllUsersFromDb).toHaveBeenCalled();
    });

    it('getActiveRoles debería retornar la lista de roles del repositorio', async () => {
      const mockRoles = [{ code: 'admin', name: 'Administrador' }];
      vi.mocked(authRepo.fetchActiveRolesFromDb).mockResolvedValue(mockRoles);

      const res = await authService.getActiveRoles();
      expect(res).toEqual(mockRoles);
    });

    it('updateUserStatus debería actualizar el estado si es válido y existe', async () => {
      vi.mocked(authRepo.updateUserStatusInDb).mockResolvedValue(1);
      const res = await authService.updateUserStatus(1, 'suspended');
      expect(res.message).toBe("Estado actualizado exitosamente");
    });

    it('updateUserStatus debería fallar ante estado inválido o si no existe', async () => {
      await expect(authService.updateUserStatus(1, 'hack')).rejects.toThrow(/no válido/);

      vi.mocked(authRepo.updateUserStatusInDb).mockResolvedValue(0); 
      await expect(authService.updateUserStatus(99, 'active')).rejects.toThrow(new AppError("Usuario no encontrado", 404));
    });

    it('deleteUser debería eliminar usuario exitosamente si no es super_admin y existe', async () => {
      vi.mocked(authRepo.getUserRoleCodeById).mockResolvedValue('registered_user');
      vi.mocked(authRepo.deleteUserFromDb).mockResolvedValue(1);
      
      const res = await authService.deleteUser(2);
      expect(res.message).toBe("Usuario eliminado correctamente");
    });

    it('deleteUser debería prohibir borrar super_admin y lanzar 404 si no existe', async () => {
      vi.mocked(authRepo.getUserRoleCodeById).mockResolvedValue('super_admin');
      await expect(authService.deleteUser(1)).rejects.toThrow(/denegada/);

      vi.mocked(authRepo.getUserRoleCodeById).mockResolvedValue('registered_user');
      vi.mocked(authRepo.deleteUserFromDb).mockResolvedValue(0); 
      await expect(authService.deleteUser(500)).rejects.toThrow("Usuario no encontrado");
    });

    it('editUserAdmin debería editar correctamente SIN cambiar la contraseña', async () => {
      vi.clearAllMocks(); 
      vi.mocked(authRepo.findRoleIdByCode).mockResolvedValue(2);
      vi.mocked(authRepo.updateUserAdminInDb).mockResolvedValue(1);

      const res = await authService.editUserAdmin(1, 'Mati', 'm@m.com', 'admin', "");
      
      expect(passwordUtils.hashPassword).not.toHaveBeenCalled();
      expect(res.message).toContain('actualizado correctamente');
    });

    it('editUserAdmin debería lanzar errores si el rol o el usuario no existen', async () => {
      vi.mocked(authRepo.findRoleIdByCode).mockResolvedValue(null);
      await expect(authService.editUserAdmin(1, 'Nom', 'e@e.com', 'invalid_role')).rejects.toThrow("El rol seleccionado no es válido");

      vi.mocked(authRepo.findRoleIdByCode).mockResolvedValue(2);
      vi.mocked(authRepo.updateUserAdminInDb).mockResolvedValue(0);
      await expect(authService.editUserAdmin(99, 'N', 'e@e.com', 'admin')).rejects.toThrow("Usuario no encontrado");
    });
  });
});