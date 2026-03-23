import { describe, it } from 'vitest';

describe('Auth Repository (PostgreSQL)', () => {
  describe('Usuarios y Cuentas', () => {
    it.todo('createAccount() debería insertar un registro en la tabla accounts y retornar BasicAccount');
    it.todo('findAccountLoginByEmail() debería traer el usuario con sus permisos (json_agg) mapeados');
    it.todo('updateUserStatusInDb() debería cambiar el estado a inactivo y retornar 1 fila afectada');
  });

  describe('Protección y Bloqueos (OWASP)', () => {
    it.todo('incrementFailedLoginAttempts() debería sumar 1 al contador actual del usuario');
    it.todo('resetFailedLoginAttempts() debería poner el contador en 0 y limpiar locked_until');
    it.todo('lockAccountUntil() debería actualizar la columna locked_until con la fecha indicada');
  });

  describe('Gestión de Sesiones y Tokens', () => {
    it.todo('createAuthSession() debería guardar la sesión vinculada al account_id');
    it.todo('revokeAllActiveSessionsByAccountId() debería marcar is_revoked = TRUE para todas las sesiones de un usuario');
    it.todo('findValidPasswordResetToken() debería ignorar tokens expirados o ya usados');
  });
});