import { describe, it } from 'vitest';

describe('Auth Endpoints (API HTTP)', () => {
  describe('POST /api/login', () => {
    it.todo('debería responder 200 y establecer la cookie HttpOnly con el refreshToken');
    it.todo('debería responder 401 ante credenciales inválidas');
  });

  describe('GET /api/usuarios (Gestión de Usuarios)', () => {
    it.todo('debería responder 401 si no se envía el header Authorization');
    it.todo('debería responder 403 si el token es válido pero no tiene el permiso "user_management.read" (Broken Access Control)');
    it.todo('debería responder 200 y el array de usuarios si tiene los permisos correctos');
  });

  describe('DELETE /api/usuarios/:id', () => {
    it.todo('debería responder 403 si el usuario no tiene permiso "user_management.delete"');
    it.todo('debería responder 403 si el ID a borrar pertenece a un super_admin');
    it.todo('debería responder 200 al borrar un usuario válido');
  });

  describe('POST /api/recuperar-password', () => {
    it.todo('debería responder 200 con un mensaje genérico incluso si el correo no existe (OWASP Anti-enumeración)');
  });
});