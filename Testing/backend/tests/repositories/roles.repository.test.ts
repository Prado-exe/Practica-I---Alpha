import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pool } from '@/config/db';
import * as rolesRepo from '@/repositories/roles.repository';

// 🛡️ MOCK DE LA BASE DE DATOS
vi.mock('@/config/db', () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(), 
  },
}));

describe('Roles Repository - Cobertura Total (100%)', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configuramos el cliente simulado para las transacciones
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };
    
    vi.mocked(pool.connect).mockResolvedValue(mockClient as any);
  });

  // ==========================================
  // 1. getRolesWithDetailsFromDb
  // ==========================================
  describe('getRolesWithDetailsFromDb()', () => {
    it('debería retornar el resumen analítico de roles', async () => {
      const mockRows = [{ role_id: 1, code: 'admin', cantidad_usuarios: 5 }];
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: mockRows } as any);

      const result = await rolesRepo.getRolesWithDetailsFromDb();
      
      expect(result).toEqual(mockRows);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    });
  });

  // ==========================================
  // 2. getAllPermissionsFromDb
  // ==========================================
  describe('getAllPermissionsFromDb()', () => {
    it('debería retornar el catálogo completo de permisos', async () => {
      const mockRows = [{ permission_id: 1, code: 'read', description: 'Lectura' }];
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: mockRows } as any);

      const result = await rolesRepo.getAllPermissionsFromDb();
      
      expect(result).toEqual(mockRows);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT permission_id, code'));
    });
  });

  // ==========================================
  // 3. createRoleWithPermissionsInDb
  // ==========================================
  describe('createRoleWithPermissionsInDb()', () => {
    it('debería ejecutar BEGIN, INSERTs (rol y múltiples permisos) y COMMIT', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ role_id: 5 }] }) // INSERT ROLE
        .mockResolvedValueOnce({}) // INSERT PERM 1
        .mockResolvedValueOnce({}) // INSERT PERM 2
        .mockResolvedValueOnce({}); // COMMIT

      // Le pasamos un array con 2 permisos para probar el bucle for
      const roleId = await rolesRepo.createRoleWithPermissionsInDb('test', 'Test', 'D', [1, 2]);

      expect(roleId).toBe(5);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('debería ejecutar ROLLBACK si ocurre un error en la transacción', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ role_id: 5 }] }) // INSERT ROLE
        .mockRejectedValueOnce(new Error('Fallo en DB')); // ERROR al insertar permisos

      await expect(rolesRepo.createRoleWithPermissionsInDb('test', 'Test', 'D', [1]))
        .rejects.toThrow('Fallo en DB');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  // ==========================================
  // 4. updateRoleWithPermissionsInDb
  // ==========================================
  describe('updateRoleWithPermissionsInDb()', () => {
    it('debería actualizar el rol, vaciar permisos, insertar nuevos y hacer COMMIT', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // UPDATE roles
        .mockResolvedValueOnce({}) // DELETE role_permissions
        .mockResolvedValueOnce({}) // INSERT perm 1
        .mockResolvedValueOnce({}); // COMMIT

      await rolesRepo.updateRoleWithPermissionsInDb(5, 'test2', 'Test 2', 'Desc', [1]);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('debería hacer ROLLBACK si falla la actualización de permisos', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error('Error al actualizar')); // Falla el UPDATE de roles

      await expect(rolesRepo.updateRoleWithPermissionsInDb(5, 'test2', 'Test 2', 'Desc', [1]))
        .rejects.toThrow('Error al actualizar');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  // ==========================================
  // 5. deleteRoleAndReassignUsersInDb
  // ==========================================
  describe('deleteRoleAndReassignUsersInDb()', () => {
    it('debería reasignar usuarios, borrar el rol y hacer COMMIT exitosamente', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ role_id: 2 }] }) // SELECT regRoleId
        .mockResolvedValueOnce({ rows: [{ code: 'custom_role' }] }) // SELECT targetCode
        .mockResolvedValueOnce({}) // UPDATE accounts
        .mockResolvedValueOnce({}) // DELETE roles
        .mockResolvedValueOnce({}); // COMMIT

      await rolesRepo.deleteRoleAndReassignUsersInDb(10);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('debería lanzar error y hacer ROLLBACK si se intenta borrar el rol super_admin', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ role_id: 2 }] }) // ID del rol registered_user
        .mockResolvedValueOnce({ rows: [{ code: 'super_admin' }] }); // Intenta borrar super_admin

      await expect(rolesRepo.deleteRoleAndReassignUsersInDb(1))
        .rejects.toThrow("PROHIBIDO: No puedes borrar roles del sistema.");
      
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('debería lanzar error y hacer ROLLBACK si se intenta borrar el rol registered_user', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ role_id: 2 }] }) // ID del rol default
        .mockResolvedValueOnce({ rows: [{ code: 'registered_user' }] }); // Intenta borrar registered_user

      await expect(rolesRepo.deleteRoleAndReassignUsersInDb(2))
        .rejects.toThrow("PROHIBIDO: No puedes borrar roles del sistema.");
      
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('debería hacer ROLLBACK si ocurre un error inesperado en la base de datos', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error('Fallo crítico de conexión')); // Falla el primer SELECT

      await expect(rolesRepo.deleteRoleAndReassignUsersInDb(10))
        .rejects.toThrow('Fallo crítico de conexión');
      
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});