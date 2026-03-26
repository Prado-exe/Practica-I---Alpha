import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as rolesService from '@/services/roles.service';
import * as rolesRepo from '@/repositories/roles.repository';
import { AppError } from '@/types/app-error';

vi.mock('@/repositories/roles.repository');

describe('Roles Service', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('Lecturas', () => {
    it('getRolesDetails y getAllPermissions deberían llamar a sus respectivos repositorios', async () => {
      vi.mocked(rolesRepo.getRolesWithDetailsFromDb).mockResolvedValue([]);
      vi.mocked(rolesRepo.getAllPermissionsFromDb).mockResolvedValue([]);
      
      await rolesService.getRolesDetails();
      await rolesService.getAllPermissions();
      
      expect(rolesRepo.getRolesWithDetailsFromDb).toHaveBeenCalled();
      expect(rolesRepo.getAllPermissionsFromDb).toHaveBeenCalled();
    });
  });

  describe('createNewRole()', () => {
    it('debería lanzar AppError 400 si faltan campos o no hay permisos', async () => {
      await expect(rolesService.createNewRole('', 'Nombre', 'Desc', []))
        .rejects.toThrow(new AppError("Faltan campos obligatorios o permisos", 400));
    });

    it('debería crear el rol exitosamente si los datos son válidos', async () => {
      vi.mocked(rolesRepo.createRoleWithPermissionsInDb).mockResolvedValue(5);
      const result = await rolesService.createNewRole('editor', 'Editor', 'D', [1, 2]);
      
      expect(result.roleId).toBe(5);
      expect(result.message).toContain("exitosamente");
    });
  });

  describe('updateExistingRole()', () => {
    it('debería lanzar AppError 400 si los campos o permisos vienen vacíos', async () => {
      await expect(rolesService.updateExistingRole(1, 'code', '', 'Desc', []))
        .rejects.toThrow(new AppError("Faltan campos obligatorios o permisos", 400));
    });

    it('debería actualizar el rol exitosamente', async () => {
      vi.mocked(rolesRepo.updateRoleWithPermissionsInDb).mockResolvedValue(undefined);
      const res = await rolesService.updateExistingRole(1, 'code', 'name', 'desc', [10]);
      
      expect(res.message).toContain("actualizado exitosamente");
      expect(rolesRepo.updateRoleWithPermissionsInDb).toHaveBeenCalledWith(1, 'code', 'name', 'desc', [10]);
    });
  });

  describe('removeRole()', () => {
    it('debería capturar errores del repositorio y lanzarlos como AppError 403', async () => {
      vi.mocked(rolesRepo.deleteRoleAndReassignUsersInDb).mockRejectedValue(new Error("No se puede borrar el rol base"));
      
      await expect(rolesService.removeRole(1))
        .rejects.toThrow(new AppError("No se puede borrar el rol base", 403));
    });

    it('debería borrar el rol exitosamente', async () => {
      vi.mocked(rolesRepo.deleteRoleAndReassignUsersInDb).mockResolvedValue(undefined);
      
      const res = await rolesService.removeRole(5);
      expect(res.message).toContain("Usuarios reasignados");
    });
  });
});