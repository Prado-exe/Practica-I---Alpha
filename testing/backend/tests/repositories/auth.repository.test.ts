import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pool } from '@/config/db';
import * as authRepo from '@/repositories/auth.repository';

vi.mock('@/config/db', () => ({
  pool: { query: vi.fn() },
}));

describe('Auth Repository (PostgreSQL)', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('Consultas de Roles y Usuarios Base', () => {
    it('findRoleIdByCode debería retornar el ID o null', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ role_id: 2 }] } as any);
      const res = await authRepo.findRoleIdByCode('admin');
      expect(res).toBe(2);

      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);
      expect(await authRepo.findRoleIdByCode('fake')).toBeNull();
    });

    it('findAccountByEmail y findAccountByUsername deberían retornar la cuenta', async () => {
      const mockAccount = { account_id: 1, email: 't@t.com', username: 'user' };
      vi.mocked(pool.query).mockResolvedValue({ rows: [mockAccount] } as any);
      
      expect(await authRepo.findAccountByEmail('t@t.com')).toEqual(mockAccount);
      expect(await authRepo.findAccountByUsername('user')).toEqual(mockAccount);
    });

    it('findAccountBasicByEmail y findAccountLoginByEmail deberían retornar la cuenta', async () => {
      const mockAccount = { account_id: 1, email: 't@t.com' };
      vi.mocked(pool.query).mockResolvedValue({ rows: [mockAccount] } as any);
      
      expect(await authRepo.findAccountBasicByEmail('t@t.com')).toEqual(mockAccount);
      expect(await authRepo.findAccountLoginByEmail('t@t.com')).toEqual(mockAccount);
    });

    it('findAccountByIdForSession debería retornar los datos para la sesión', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ account_id: 1 }] } as any);
      expect(await authRepo.findAccountByIdForSession(1)).toEqual({ account_id: 1 });
    });
  });

  describe('Creación y Actualización de Cuentas', () => {
    it('createAccount debería insertar y retornar BasicAccount', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ account_id: 10 }] } as any);
      const res = await authRepo.createAccount({ roleId: 1, username: 'u', email: 'e', passwordHash: 'h', fullName: 'f', accountStatus: 's' });
      expect(res.account_id).toBe(10);
    });

    it('updateAccountStatus, updateLastLoginAt y updateAccountPassword deberían actualizar', async () => {
      vi.mocked(pool.query).mockResolvedValue({} as any);
      
      await authRepo.updateAccountStatus(1, 'active');
      await authRepo.updateLastLoginAt(1);
      await authRepo.updateAccountPassword(1, 'new_hash');
      
      expect(pool.query).toHaveBeenCalledTimes(3);
    });

    it('activateAccount debería setear email_verified a TRUE', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({} as any);
      await authRepo.activateAccount(1);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('email_verified = TRUE'), [1]);
    });
  });

  describe('Manejo de Intentos y Bloqueos (OWASP)', () => {
    it('incrementFailedLoginAttempts, resetFailedLoginAttempts, lockAccountUntil deberían ejecutarse', async () => {
      vi.mocked(pool.query).mockResolvedValue({} as any);
      
      await authRepo.incrementFailedLoginAttempts(1);
      await authRepo.resetFailedLoginAttempts(1);
      await authRepo.lockAccountUntil(1, new Date());
      
      expect(pool.query).toHaveBeenCalledTimes(3);
    });
  });

  describe('Códigos de Verificación y Recuperación', () => {
    it('createVerificationCode y createRevalidationCode deberían insertar', async () => {
      vi.mocked(pool.query).mockResolvedValue({ rows: [{ verification_code_id: 1 }] } as any);
      
      await authRepo.createVerificationCode({ accountId: 1, destination: 'd', destinationMasked: 'm', codeHash: 'h', expiresAt: new Date() });
      await authRepo.createRevalidationCode(1, 'e', 'h', new Date());
      
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('findLatestVerificationCodeByAccountId y findValidVerificationCodeByHash deberían buscar códigos', async () => {
      vi.mocked(pool.query).mockResolvedValue({ rows: [{ verification_code_id: 1 }] } as any);
      
      await authRepo.findLatestVerificationCodeByAccountId(1, 'register_email');
      await authRepo.findValidVerificationCodeByHash('hash', 'register_email');
      
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('Modificadores de códigos: increment, consume, invalidate, markResent, block', async () => {
      vi.mocked(pool.query).mockResolvedValue({} as any);
      
      await authRepo.incrementVerificationAttempts(1);
      await authRepo.consumeVerificationCode(1);
      await authRepo.invalidateActiveVerificationCodes(1, 'register_email', 'reason');
      await authRepo.markVerificationCodeResent(1, new Date(), 'hash');
      await authRepo.blockVerificationCodeUntil(1, new Date());
      
      expect(pool.query).toHaveBeenCalledTimes(5);
    });

    it('Tokens de Password: create, findValid, consume', async () => {
      vi.mocked(pool.query).mockResolvedValue({ rows: [{ password_reset_token_id: '1' }] } as any);
      
      await authRepo.createPasswordResetToken(1, 'hash', new Date());
      await authRepo.findValidPasswordResetToken('hash');
      await authRepo.consumePasswordResetToken('1');
      
      expect(pool.query).toHaveBeenCalledTimes(3);
    });
  });

  describe('Gestión de Sesiones (Auth Sessions)', () => {
    it('createAuthSession debería insertar y retornar la sesión', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ session_id: 5 }] } as any);
      const res = await authRepo.createAuthSession({ accountId: 1, currentRefreshTokenId: '1', refreshTokenHash: 'h', expiresAt: new Date() });
      expect(res.session_id).toBe(5);
    });

    it('findAuthSessionById, revokeAuthSession, updateAuthSessionLastUsed', async () => {
      vi.mocked(pool.query).mockResolvedValue({ rows: [{ session_id: 5 }] } as any);
      
      await authRepo.findAuthSessionById(5);
      await authRepo.revokeAuthSession(5, 'logout');
      await authRepo.updateAuthSessionLastUsed(5);
      
      expect(pool.query).toHaveBeenCalledTimes(3);
    });

    it('rotateAuthSessionRefreshToken y revokeAllActiveSessionsByAccountId', async () => {
      vi.mocked(pool.query).mockResolvedValue({ rows: [{ session_id: 5 }] } as any);
      
      await authRepo.rotateAuthSessionRefreshToken(5, 'new_id', 'new_hash', new Date());
      await authRepo.revokeAllActiveSessionsByAccountId(1, 'new_login');
      
      expect(pool.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('Panel de Administración (CRUD Usuarios)', () => {
    it('fetchAllUsersFromDb y fetchActiveRolesFromDb deberían retornar arrays', async () => {
      vi.mocked(pool.query).mockResolvedValue({ rows: [{ id: 1 }] } as any);
      
      expect(await authRepo.fetchAllUsersFromDb()).toHaveLength(1);
      expect(await authRepo.fetchActiveRolesFromDb()).toHaveLength(1);
    });

    it('updateUserStatusInDb y deleteUserFromDb deberían retornar rowCount', async () => {
      vi.mocked(pool.query).mockResolvedValue({ rowCount: 1 } as any);
      
      expect(await authRepo.updateUserStatusInDb(1, 'active')).toBe(1);
      expect(await authRepo.deleteUserFromDb(1)).toBe(1);
    });

    it('getUserRoleCodeById debería retornar el código o null', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ code: 'admin' }] } as any);
      expect(await authRepo.getUserRoleCodeById(1)).toBe('admin');

      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);
      expect(await authRepo.getUserRoleCodeById(99)).toBeNull();
    });

    it('updateUserAdminInDb debería actualizar con o sin password', async () => {
      vi.mocked(pool.query).mockResolvedValue({ rowCount: 1 } as any);
      
      // Rama CON passwordHash
      await authRepo.updateUserAdminInDb(1, 'Nombre', 'e@e.com', 2, 'hash_nuevo');
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('password_hash = $4'), expect.any(Array));
      
      // Rama SIN passwordHash
      await authRepo.updateUserAdminInDb(1, 'Nombre', 'e@e.com', 2);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('role_id = $3'), [ 'Nombre', 'e@e.com', 2, 1 ]);
    });
  });
});