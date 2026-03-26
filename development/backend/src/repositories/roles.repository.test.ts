import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pool } from '../config/db';
import * as rolesRepo from './roles.repository';

// 👇 ESTO ES LO QUE FALTABA: Decirle a Vitest que mockee la base de datos
vi.mock('../config/db', () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(), // Ahora connect es un espía que podemos manipular
  },
}));

describe('Roles Repository - Transacciones', () => {
  const mockClient = {
    query: vi.fn(),
    release: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Ahora pool.connect sí acepta mockResolvedValue sin quejarse
    vi.mocked(pool.connect).mockResolvedValue(mockClient as any);
  });

  it('createRoleWithPermissionsInDb debería ejecutar BEGIN, INSERTs y COMMIT', async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ role_id: 5 }] }) // INSERT ROLE
      .mockResolvedValueOnce({}) // INSERT PERM
      .mockResolvedValueOnce({}); // COMMIT

    await rolesRepo.createRoleWithPermissionsInDb('test', 'Test', 'D', [1]);

    expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(mockClient.query).toHaveBeenNthCalledWith(4, 'COMMIT');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('debería ejecutar ROLLBACK si ocurre un error en la transacción', async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ role_id: 5 }] }) // INSERT ROLE
      .mockRejectedValueOnce(new Error('Fallo en DB')); // ERROR provocado

    await expect(rolesRepo.createRoleWithPermissionsInDb('test', 'Test', 'D', [1]))
      .rejects.toThrow('Fallo en DB');

    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('deleteRoleAndReassignUsersInDb debería lanzar error si se intenta borrar roles base', async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ role_id: 1 }] }) // ID del rol default
      .mockResolvedValueOnce({ rows: [{ code: 'super_admin' }] }); // Simulamos que intenta borrar super_admin

    await expect(rolesRepo.deleteRoleAndReassignUsersInDb(10))
      .rejects.toThrow("PROHIBIDO: No puedes borrar roles del sistema.");
    
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });
});