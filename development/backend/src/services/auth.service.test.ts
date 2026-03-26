import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from './auth.service';
import * as authRepo from '../repositories/auth.repository';
import * as passwordUtils from '../utils/password';
import * as jwtUtils from '../utils/jwt';
import * as mailerUtils from '../utils/mailer';
import * as otpUtils from '../utils/otp';
import * as tokenUtils from '../utils/token';
import { AppError } from '../types/app-error';
import { createHash } from 'crypto'; // 👈 Añade esta línea



// Mockeamos todas las dependencias
vi.mock('../repositories/auth.repository');
vi.mock('../utils/password');
vi.mock('../utils/jwt');
vi.mock('../utils/mailer');
vi.mock('../utils/otp');
vi.mock('../utils/token');
vi.mock('../config/env', () => ({
  env: { 
    REFRESH_TOKEN_EXPIRES_IN_MS: 1000, 
    ACCESS_TOKEN_EXPIRES_IN_MS: 1000, 
    FRONTEND_ORIGIN: 'http://localhost' 
  }
}));

describe('Auth Service - Cobertura 100%', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('Funciones Auxiliares (Internas)', () => {
    it('mapPublicAccount debería transformar objetos con roles por defecto', () => {
      const input = { account_id: 1, username: 'u', email: 'e@e.com' };
      const res = authService.mapPublicAccount(input);
      expect(res.role).toBe('registered_user');
      expect(res.permissions).toEqual([]);
    });
  });

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
        destinationMasked: 't*@te.com' // Valida maskEmail
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
      
      // Simula colisiones: 't' existe, 't1' existe, 't2' libre (basado en t@t.com)
      vi.mocked(authRepo.findAccountByUsername)
        .mockResolvedValueOnce({ username: 't' } as any)
        .mockResolvedValueOnce({ username: 't1' } as any)
        .mockResolvedValue(null);
        
      vi.mocked(authRepo.createAccount).mockResolvedValue({ account_id: 1, email: 't@t.com' } as any);

      await authService.registerUser({ email: 't@t.com', password: '123', name: 'M' } as any);
      
      // 👇 Ahora esperamos 't2' porque el correo es 't@t.com'
      expect(authRepo.createAccount).toHaveBeenCalledWith(expect.objectContaining({
        username: 't2'
      }));
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

    it('debería fallar si la cuenta no está activa o verificada', async () => {
      vi.mocked(authRepo.findAccountLoginByEmail).mockResolvedValue({ account_status: 'inactive', email_verified: false } as any);
      vi.mocked(passwordUtils.comparePassword).mockResolvedValue(true);
      await expect(authService.loginUser({ email: 't@t.com', password: '1' })).rejects.toThrow(/verificar su correo/);
    });
  });

  describe('verifyEmailCode()', () => {
    it('debería manejar éxito en revalidación tras bloqueo', async () => {
      vi.mocked(authRepo.findAccountBasicByEmail).mockResolvedValue({ account_id: 1, account_status: 'pending_revalidation' } as any);
      vi.mocked(authRepo.findLatestVerificationCodeByAccountId).mockResolvedValue({ code_hash: 'hash', expires_at: new Date(Date.now() + 1000) } as any);
      vi.mocked(otpUtils.hashOtpCode).mockReturnValue('hash');

      const res = await authService.verifyEmailCode({ email: 't@t.com', codigo: '123' });
      expect(res.message).toContain('desbloqueada con éxito');
      expect(authRepo.updateAccountStatus).toHaveBeenCalledWith(1, 'active');
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
      vi.mocked(otpUtils.hashOtpCode).mockReturnValue('h2'); // Fallo manual

      await expect(authService.verifyEmailCode({ email: 't@t.com', codigo: 'wrong' })).rejects.toThrow(/máximo de intentos/);
      expect(authRepo.blockVerificationCodeUntil).toHaveBeenCalled();
    });

    it('debería fallar si el código ya fue consumido o invalidado', async () => {
      vi.mocked(authRepo.findAccountBasicByEmail).mockResolvedValue({ account_id: 1 } as any);
      
      // Caso 1: Consumido
      vi.mocked(authRepo.findLatestVerificationCodeByAccountId).mockResolvedValueOnce({ consumed_at: new Date() } as any);
      await expect(authService.verifyEmailCode({ email: 'a@a.com', codigo: '1' }))
        .rejects.toThrow("Este código ya fue utilizado");

      // Caso 2: Invalidado
      vi.mocked(authRepo.findLatestVerificationCodeByAccountId).mockResolvedValueOnce({ invalidated_at: new Date() } as any);
      await expect(authService.verifyEmailCode({ email: 'a@a.com', codigo: '1' }))
        .rejects.toThrow("El código ya no es válido");
    });
  });

  describe('refreshUserSession()', () => {
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
      const fakeHash = createHash('sha256').update(fakeToken).digest('hex'); // 👈 Generamos el hash real
      
      vi.mocked(jwtUtils.verifyRefreshToken).mockReturnValue({ sessionId: 1, tokenId: 't1' } as any);
      
      vi.mocked(authRepo.findAuthSessionById).mockResolvedValue({ 
        session_id: 1,
        account_id: 10,
        current_refresh_token_id: 't1', 
        refresh_token_hash: fakeHash, 
        is_revoked: false, 
        expires_at: new Date(Date.now() + 100000) 
      } as any);

      vi.mocked(authRepo.findAccountByIdForSession).mockResolvedValue({ 
        email_verified: true, 
        account_status: 'suspended' 
      } as any);

      await expect(authService.refreshUserSession(fakeToken)).rejects.toThrow(/La cuenta no está habilitada/);
    });

    it('refreshUserSession debería revocar la sesión si expiró en la base de datos', async () => {
      const pastDate = new Date(Date.now() - 10000); 
      vi.mocked(jwtUtils.verifyRefreshToken).mockReturnValue({ sessionId: 1, tokenId: 't1' } as any);
      
      vi.mocked(authRepo.findAuthSessionById).mockResolvedValue({ 
        session_id: 1, 
        expires_at: pastDate, 
        is_revoked: false 
      } as any);

      await expect(authService.refreshUserSession('any_token'))
        .rejects.toThrow("La sesión ha expirado");
        
      expect(authRepo.revokeAuthSession).toHaveBeenCalledWith(1, "refresh_token_expired");
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
        resend_count: 3, 
        verification_code_id: 100 
      } as any);

      await expect(authService.resendVerificationCode('test@test.com'))
        .rejects.toThrow("Se alcanzó el máximo de reenvíos permitidos");
        
      expect(authRepo.blockVerificationCodeUntil).toHaveBeenCalledWith(100, expect.any(Date));
    });
  });

  describe('Panel Admin', () => {
    it('updateUserStatus debería fallar ante estado inválido', async () => {
      await expect(authService.updateUserStatus(1, 'hack')).rejects.toThrow(/no válido/);
    });

    it('deleteUser debería prohibir borrar super_admin', async () => {
      vi.mocked(authRepo.getUserRoleCodeById).mockResolvedValue('super_admin');
      await expect(authService.deleteUser(1)).rejects.toThrow(/denegada/);
    });

    it('editUserAdmin debería permitir cambiar password o no', async () => {
      vi.mocked(authRepo.findRoleIdByCode).mockResolvedValue(2);
      vi.mocked(authRepo.updateUserAdminInDb).mockResolvedValue(1);
      
      const res = await authService.editUserAdmin(1, 'N', 'e@e.com', 'admin', 'newpass');
      expect(res.message).toContain('correctamente');
      expect(passwordUtils.hashPassword).toHaveBeenCalled();
    });
    it('deleteUser debería lanzar 404 si el repositorio no encuentra al usuario', async () => {
      vi.mocked(authRepo.getUserRoleCodeById).mockResolvedValue('registered_user');
      vi.mocked(authRepo.deleteUserFromDb).mockResolvedValue(0); // 0 filas afectadas

      await expect(authService.deleteUser(999)).rejects.toThrow(/Usuario no encontrado/);
    });
  });
});

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

    it('executePasswordReset debería lanzar error 400 si el token no es válido o expiró', async () => {
      vi.mocked(tokenUtils.hashSecureToken).mockReturnValue('hash_malo');
      vi.mocked(authRepo.findValidPasswordResetToken).mockResolvedValue(null);

      await expect(authService.executePasswordReset('token_fake', 'NewPass123!'))
        .rejects.toThrow(new AppError("El enlace de recuperación es inválido o ha expirado.", 400));
    });

    it('executePasswordReset debería actualizar password y revocar sesiones al tener éxito', async () => {
      vi.mocked(authRepo.findValidPasswordResetToken).mockResolvedValue({ account_id: 10, password_reset_token_id: 'token_id' } as any);
      vi.mocked(passwordUtils.hashPassword).mockResolvedValue('new_hash');

      const res = await authService.executePasswordReset('token_ok', 'NewPass123!');

      expect(authRepo.updateAccountPassword).toHaveBeenCalledWith(10, 'new_hash');
      expect(authRepo.consumePasswordResetToken).toHaveBeenCalledWith('token_id');
      expect(authRepo.revokeAllActiveSessionsByAccountId).toHaveBeenCalledWith(10, 'password_reset');
      expect(res.message).toContain('Contraseña actualizada');
    });
  });

  describe('Admin - Status and Roles', () => {
    it('updateUserStatus debería lanzar 404 si el usuario no existe en la BD', async () => {
      // Simulamos que el repo devuelve 0 filas afectadas
      vi.mocked(authRepo.updateUserStatusInDb).mockResolvedValue(0); 

      await expect(authService.updateUserStatus(99, 'active'))
        .rejects.toThrow(new AppError("Usuario no encontrado", 404));
    });

    it('getActiveRoles debería retornar la lista de roles del repositorio', async () => {
      const mockRoles = [{ code: 'admin', name: 'Administrador' }];
      vi.mocked(authRepo.fetchActiveRolesFromDb).mockResolvedValue(mockRoles);

      const res = await authService.getActiveRoles();
      expect(res).toEqual(mockRoles);
    });
  });

  describe('deleteUser() - Edge Cases', () => {
    it('debería lanzar 404 si el usuario a eliminar no existe', async () => {
      vi.mocked(authRepo.getUserRoleCodeById).mockResolvedValue('registered_user');
      vi.mocked(authRepo.deleteUserFromDb).mockResolvedValue(0); // 0 filas

      await expect(authService.deleteUser(500))
        .rejects.toThrow(new AppError("Usuario no encontrado", 404));
    });
    it('debería lanzar 404 si deleteUser no encuentra filas (Línea 584)', async () => {
      vi.mocked(authRepo.getUserRoleCodeById).mockResolvedValue('registered_user');
      vi.mocked(authRepo.deleteUserFromDb).mockResolvedValue(0); 

      await expect(authService.deleteUser(500)).rejects.toThrow("Usuario no encontrado");
    });
  });

  describe('editUserAdmin()', () => {
    it('debería lanzar 400 si el rol proporcionado no existe', async () => {
      vi.mocked(authRepo.findRoleIdByCode).mockResolvedValue(null);
      
      await expect(authService.editUserAdmin(1, 'Nom', 'e@e.com', 'invalid_role'))
        .rejects.toThrow(new AppError("El rol seleccionado no es válido", 400));
    });

    it('debería editar correctamente SIN cambiar la contraseña', async () => {
        vi.clearAllMocks(); 
        vi.mocked(authRepo.findRoleIdByCode).mockResolvedValue(2);
        vi.mocked(authRepo.updateUserAdminInDb).mockResolvedValue(1);

        const res = await authService.editUserAdmin(1, 'Mati', 'm@m.com', 'admin', "");
        
        expect(passwordUtils.hashPassword).not.toHaveBeenCalled();
        expect(res.message).toContain('actualizado correctamente');
      });

    it('debería lanzar 404 si el usuario a editar no existe', async () => {
      vi.mocked(authRepo.findRoleIdByCode).mockResolvedValue(2);
      vi.mocked(authRepo.updateUserAdminInDb).mockResolvedValue(0);

      await expect(authService.editUserAdmin(99, 'N', 'e@e.com', 'admin'))
        .rejects.toThrow(new AppError("Usuario no encontrado", 404));
    });
    it('debería lanzar 400 si el rol no es válido (Líneas 630-631)', async () => {
      vi.mocked(authRepo.findRoleIdByCode).mockResolvedValue(null);
      
      await expect(authService.editUserAdmin(1, 'Nombre', 'e@e.com', 'rol_fantasma'))
        .rejects.toThrow("El rol seleccionado no es válido");
    });

    it('debería retornar éxito tras editar (Línea 648)', async () => {
      vi.mocked(authRepo.findRoleIdByCode).mockResolvedValue(2);
      vi.mocked(authRepo.updateUserAdminInDb).mockResolvedValue(1);

      const res = await authService.editUserAdmin(1, 'N', 'e@e.com', 'admin');
      expect(res.message).toBe("Usuario actualizado correctamente");
    });
  });

describe('resendVerificationCode() - Casos de Borde', () => {
  it('debería retornar mensaje genérico si el usuario no existe (Línea 389)', async () => {
    vi.mocked(authRepo.findAccountBasicByEmail).mockResolvedValue(null);
    const res = await authService.resendVerificationCode('noexiste@t.com');
    expect(res.message).toContain('se enviará un nuevo código');
  });

  it('debería retornar mensaje genérico si la cuenta ya está activa (Línea 395)', async () => {
    vi.mocked(authRepo.findAccountBasicByEmail).mockResolvedValue({ 
      email_verified: true, account_status: 'active' 
    } as any);
    const res = await authService.resendVerificationCode('activa@t.com');
    expect(res.message).toContain('se enviará un nuevo código');
  });

  it('debería fallar si el código actual tiene un bloqueo temporal (Línea 408)', async () => {
    vi.mocked(authRepo.findAccountBasicByEmail).mockResolvedValue({ account_id: 1 } as any);
    vi.mocked(authRepo.findLatestVerificationCodeByAccountId).mockResolvedValue({ 
      blocked_until: new Date(Date.now() + 5000) // Bloqueado por 5 seg
    } as any);

    await expect(authService.resendVerificationCode('t@t.com'))
      .rejects.toThrow("Debes esperar antes de solicitar otro código");
  });
});

describe('resendVerificationCode() - Casos de Borde', () => {
  it('debería retornar mensaje genérico si el usuario no existe (Línea 389)', async () => {
    vi.mocked(authRepo.findAccountBasicByEmail).mockResolvedValue(null);
    const res = await authService.resendVerificationCode('noexiste@t.com');
    expect(res.message).toContain('se enviará un nuevo código');
  });

  it('debería retornar mensaje genérico si la cuenta ya está activa (Línea 395)', async () => {
    vi.mocked(authRepo.findAccountBasicByEmail).mockResolvedValue({ 
      email_verified: true, account_status: 'active' 
    } as any);
    const res = await authService.resendVerificationCode('activa@t.com');
    expect(res.message).toContain('se enviará un nuevo código');
  });

  it('debería fallar si el código actual tiene un bloqueo temporal (Línea 408)', async () => {
    vi.mocked(authRepo.findAccountBasicByEmail).mockResolvedValue({ account_id: 1 } as any);
    vi.mocked(authRepo.findLatestVerificationCodeByAccountId).mockResolvedValue({ 
      blocked_until: new Date(Date.now() + 5000) // Bloqueado por 5 seg
    } as any);

    await expect(authService.resendVerificationCode('t@t.com'))
      .rejects.toThrow("Debes esperar antes de solicitar otro código");
  });
});

describe('executePasswordReset() - Cobertura Total (Líneas 463-489)', () => {
  it('debería fallar si el token no es válido o ya fue usado (Línea 473)', async () => {
    vi.mocked(tokenUtils.hashSecureToken).mockReturnValue('hash_malo');
    vi.mocked(authRepo.findValidPasswordResetToken).mockResolvedValue(null);

    await expect(authService.executePasswordReset('token_invalido', 'Pass123!'))
      .rejects.toThrow("El enlace de recuperación es inválido o ha expirado.");
  });

  it('debería procesar el cambio de clave correctamente (Líneas 476-489)', async () => {
    // 1. Preparamos el mock del token encontrado
    vi.mocked(authRepo.findValidPasswordResetToken).mockResolvedValue({ 
      account_id: 10, 
      password_reset_token_id: 'token_id' 
    } as any);
    vi.mocked(passwordUtils.hashPassword).mockResolvedValue('hash_clave_nueva');
    
    const res = await authService.executePasswordReset('token_valido', 'Pass123!');
    
    // 2. Verificamos que se actualizaron los datos y se revocaron las sesiones
    expect(authRepo.updateAccountPassword).toHaveBeenCalledWith(10, 'hash_clave_nueva');
    expect(authRepo.consumePasswordResetToken).toHaveBeenCalledWith('token_id');
    expect(authRepo.revokeAllActiveSessionsByAccountId).toHaveBeenCalledWith(10, 'password_reset');
    expect(res.message).toBe("Contraseña actualizada con éxito.");
  });
});

describe('getActiveRoles()', () => {
    it('getActiveRoles debería llamar al repositorio (Línea 667)', async () => {
      const mockRoles = [{ code: 'r', name: 'n' }];
      vi.mocked(authRepo.fetchActiveRolesFromDb).mockResolvedValue(mockRoles);
      
      const res = await authService.getActiveRoles();
      expect(res).toEqual(mockRoles);
    });
  });

describe('requestPasswordReset()', () => {
    it('debería retornar éxito genérico si el email no existe (Línea 427)', async () => {
      vi.mocked(authRepo.findAccountBasicByEmail).mockResolvedValue(null);
      
      const res = await authService.requestPasswordReset('no-existe@test.com');
      
      // OWASP: No revelamos si el correo existe o no
      expect(res.message).toContain('Si el correo está registrado');
      expect(authRepo.createPasswordResetToken).not.toHaveBeenCalled();
    });

    it('debería generar tokens, hashear y retornar éxito (Líneas 438-439, 454-455)', async () => {
      vi.mocked(authRepo.findAccountBasicByEmail).mockResolvedValue({ account_id: 1, email: 't@t.com' } as any);
      vi.mocked(tokenUtils.generateSecureToken).mockReturnValue('token_plano');
      vi.mocked(tokenUtils.hashSecureToken).mockReturnValue('token_hasheado');
      
      const res = await authService.requestPasswordReset('t@t.com');
      
      // Verificamos que se guardó el hash correctamente
      expect(authRepo.createPasswordResetToken).toHaveBeenCalledWith(1, 'token_hasheado', expect.any(Date));
      expect(res.message).toContain('se enviará un enlace');
    });
  });