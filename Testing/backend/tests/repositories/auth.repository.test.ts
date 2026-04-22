import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pool } from '@/config/db';
import * as authRepo from '@/repositories/auth.repository';

vi.mock('@/config/db', () => ({
  pool: { query: vi.fn() },
}));

describe('Auth Repository (PostgreSQL) - Cobertura Total', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('Consultas de Roles y Usuarios Base', () => {
    it('findRoleIdByCode debería retornar el ID o null', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ role_id: 2 }] } as any);
      const res = await authRepo.findRoleIdByCode('admin');
      expect(res).toBe(2);

      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);
      expect(await authRepo.findRoleIdByCode('fake')).toBeNull();
    });

    it('findAccountByEmail y findAccountByUsername deberían retornar la cuenta o null', async () => {
      const mockAccount = { account_id: 1, email: 't@t.com', username: 'user' };
      vi.mocked(pool.query).mockResolvedValue({ rows: [mockAccount] } as any);
      
      expect(await authRepo.findAccountByEmail('t@t.com')).toEqual(mockAccount);
      expect(await authRepo.findAccountByUsername('user')).toEqual(mockAccount);

      // Rama: rows vacío (?? null)
      vi.mocked(pool.query).mockResolvedValue({ rows: [] } as any);
      expect(await authRepo.findAccountByEmail('fail@fail.com')).toBeNull();
      expect(await authRepo.findAccountByUsername('fail')).toBeNull();
    });

    it('findAccountBasicByEmail y findAccountLoginByEmail deberían retornar la cuenta o null', async () => {
      const mockAccount = { account_id: 1, email: 't@t.com' };
      vi.mocked(pool.query).mockResolvedValue({ rows: [mockAccount] } as any);
      
      expect(await authRepo.findAccountBasicByEmail('t@t.com')).toEqual(mockAccount);
      expect(await authRepo.findAccountLoginByEmail('t@t.com')).toEqual(mockAccount);

      // Rama: rows vacío (?? null)
      vi.mocked(pool.query).mockResolvedValue({ rows: [] } as any);
      expect(await authRepo.findAccountBasicByEmail('fail@fail.com')).toBeNull();
      expect(await authRepo.findAccountLoginByEmail('fail@fail.com')).toBeNull();
    });

    it('findAccountByIdForSession debería retornar los datos para la sesión o null', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ account_id: 1 }] } as any);
      expect(await authRepo.findAccountByIdForSession(1)).toEqual({ account_id: 1 });

      // Rama: rows vacío (?? null)
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);
      expect(await authRepo.findAccountByIdForSession(99)).toBeNull();
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

    it('findLatestVerificationCodeByAccountId y findValidVerificationCodeByHash deberían buscar códigos o retornar null', async () => {
      vi.mocked(pool.query).mockResolvedValue({ rows: [{ verification_code_id: 1 }] } as any);
      
      await authRepo.findLatestVerificationCodeByAccountId(1, 'register_email');
      await authRepo.findValidVerificationCodeByHash('hash', 'register_email');
      expect(pool.query).toHaveBeenCalledTimes(2);

      // Rama: rows vacío (?? null)
      vi.mocked(pool.query).mockResolvedValue({ rows: [] } as any);
      expect(await authRepo.findLatestVerificationCodeByAccountId(99, 'register_email')).toBeNull();
      expect(await authRepo.findValidVerificationCodeByHash('bad', 'register_email')).toBeNull();
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

      // Rama: rows vacío en findValid (?? null)
      vi.mocked(pool.query).mockResolvedValue({ rows: [] } as any);
      expect(await authRepo.findValidPasswordResetToken('bad')).toBeNull();
    });
  });

  describe('Gestión de Sesiones (Auth Sessions)', () => {
    it('createAuthSession debería insertar y usar los fallbacks ?? para parámetros opcionales', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ session_id: 5 }] } as any);
      // Solo enviamos los requeridos para forzar el sessionType ?? "web" y demás fallbacks a null
      const res = await authRepo.createAuthSession({ accountId: 1, currentRefreshTokenId: '1', refreshTokenHash: 'h', expiresAt: new Date() });
      
      expect(res.session_id).toBe(5);
      expect(pool.query).toHaveBeenCalledWith(expect.anything(), expect.arrayContaining(["web"])); // Verifica el default "web"
    });

    it('findAuthSessionById, revokeAuthSession, updateAuthSessionLastUsed', async () => {
      vi.mocked(pool.query).mockResolvedValue({ rows: [{ session_id: 5 }] } as any);
      
      await authRepo.findAuthSessionById(5);
      // Rama: Parámetro por defecto de revoke (reason = "logout")
      await authRepo.revokeAuthSession(5); 
      await authRepo.updateAuthSessionLastUsed(5);
      
      expect(pool.query).toHaveBeenCalledTimes(3);

      // Verificamos el parámetro por defecto "logout" inyectado en la query
      expect(vi.mocked(pool.query).mock.calls[1][1]).toContain("logout");

      // Rama: rows vacío (?? null) en find
      vi.mocked(pool.query).mockResolvedValue({ rows: [] } as any);
      expect(await authRepo.findAuthSessionById(99)).toBeNull();
    });

    it('rotateAuthSessionRefreshToken y revokeAllActiveSessionsByAccountId', async () => {
      vi.mocked(pool.query).mockResolvedValue({ rows: [{ session_id: 5 }] } as any);
      
      await authRepo.rotateAuthSessionRefreshToken(5, 'new_id', 'new_hash', new Date());
      // Rama: Parámetro por defecto de revokeAll (reason = "new_login")
      await authRepo.revokeAllActiveSessionsByAccountId(1); 
      
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(vi.mocked(pool.query).mock.calls[1][1]).toContain("new_login");

      // Rama: rows vacío (?? null) en rotate
      vi.mocked(pool.query).mockResolvedValue({ rows: [] } as any);
      expect(await authRepo.rotateAuthSessionRefreshToken(99, 'id', 'hash', new Date())).toBeNull();
    });
  });

  describe('Panel de Administración (CRUD Usuarios)', () => {
    it('fetchAllUsersFromDb y fetchActiveRolesFromDb deberían retornar arrays', async () => {
      vi.mocked(pool.query).mockResolvedValue({ rows: [{ id: 1 }] } as any);
      
      expect(await authRepo.fetchAllUsersFromDb()).toHaveLength(1);
      expect(await authRepo.fetchActiveRolesFromDb()).toHaveLength(1);
    });

    it('updateUserStatusInDb y deleteUserFromDb deberían retornar rowCount o 0 (?? 0)', async () => {
      vi.mocked(pool.query).mockResolvedValue({ rowCount: 1 } as any);
      expect(await authRepo.updateUserStatusInDb(1, 'active')).toBe(1);
      expect(await authRepo.deleteUserFromDb(1)).toBe(1);

      // Rama: rowCount undefined (?? 0)
      vi.mocked(pool.query).mockResolvedValue({} as any);
      expect(await authRepo.updateUserStatusInDb(1, 'active')).toBe(0);
      expect(await authRepo.deleteUserFromDb(1)).toBe(0);
    });

    it('getUserRoleCodeById debería retornar el código o null', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ code: 'admin' }] } as any);
      expect(await authRepo.getUserRoleCodeById(1)).toBe('admin');

      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);
      expect(await authRepo.getUserRoleCodeById(99)).toBeNull();
    });

    it('updateUserAdminInDb debería actualizar con/sin password y retornar rowCount o 0 (?? 0)', async () => {
      vi.mocked(pool.query).mockResolvedValue({ rowCount: 1 } as any);
      
      // Rama CON passwordHash
      await authRepo.updateUserAdminInDb(1, 'Nombre', 'e@e.com', 2, 'hash_nuevo');
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('password_hash = $4'), expect.any(Array));
      
      // Rama SIN passwordHash
      await authRepo.updateUserAdminInDb(1, 'Nombre', 'e@e.com', 2);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('role_id = $3'), [ 'Nombre', 'e@e.com', 2, 1 ]);

      // Rama: rowCount undefined (?? 0)
      vi.mocked(pool.query).mockResolvedValue({} as any);
      expect(await authRepo.updateUserAdminInDb(1, 'Nombre', 'e@e.com', 2, 'hash')).toBe(0);
      expect(await authRepo.updateUserAdminInDb(1, 'Nombre', 'e@e.com', 2)).toBe(0);
    });
  });
});