import { describe, it } from 'vitest';

describe('Auth Service (Business Logic)', () => {
  describe('registerUser()', () => {
    it.todo('debería registrar un usuario correctamente y enviar email de verificación');
    it.todo('debería lanzar AppError 409 si el correo ya existe (OWASP)');
    it.todo('debería lanzar AppError 500 si el rol "registered_user" no existe');
  });

  describe('loginUser()', () => {
    it.todo('debería devolver accessToken y refreshToken si las credenciales son válidas');
    it.todo('debería lanzar AppError 401 sin revelar si falla el correo o la contraseña (OWASP Anti-enumeración)');
    it.todo('debería lanzar AppError 403 si la cuenta está actualmente bloqueada (locked_until)');
    it.todo('debería retornar requiresRevalidation si el estado es "pending_revalidation"');
    it.todo('debería incrementar failed_login_count al fallar la contraseña');
    it.todo('debería bloquear la cuenta por 1 hora al llegar a 10 intentos fallidos (OWASP Fuerza Bruta)');
    it.todo('debería enviar un código OTP de revalidación si la cuenta acaba de salir de un bloqueo temporal');
  });

  describe('refreshUserSession()', () => {
    it.todo('debería rotar el refresh token correctamente y devolver tokens nuevos');
    it.todo('debería lanzar AppError 401 si se detecta reutilización de un refresh token (OWASP)');
    it.todo('debería revocar la sesión si la cuenta fue desactivada mientras la sesión estaba activa');
  });

  describe('deleteUser()', () => {
    it.todo('debería lanzar AppError 403 si se intenta eliminar a un super_admin');
    it.todo('debería eliminar un usuario normal exitosamente');
  });
});