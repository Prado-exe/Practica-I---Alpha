import {
  getRolesWithDetailsFromDb,
  getAllPermissionsFromDb,
  createRoleWithPermissionsInDb,
  updateRoleWithPermissionsInDb,
  deleteRoleAndReassignUsersInDb
} from "../repositories/roles.repository";
import { AppError } from "../types/app-error";

export async function getRolesDetails() {
  return await getRolesWithDetailsFromDb();
}

export async function getAllPermissions() {
  return await getAllPermissionsFromDb();
}

export async function createNewRole(code: string, name: string, description: string, permisos: number[]) {
  if (!code || !name || !permisos || permisos.length === 0) {
    throw new AppError("Faltan campos obligatorios o permisos", 400);
  }
  
  const roleId = await createRoleWithPermissionsInDb(code, name, description, permisos);
  return { message: "Rol creado exitosamente", roleId };
}

export async function updateExistingRole(roleId: number, code: string, name: string, description: string, permisos: number[]) {
  if (!code || !name || !permisos || permisos.length === 0) {
    throw new AppError("Faltan campos obligatorios o permisos", 400);
  }

  await updateRoleWithPermissionsInDb(roleId, code, name, description, permisos);
  return { message: "Rol actualizado exitosamente" };
}

export async function removeRole(roleId: number) {
  try {
    await deleteRoleAndReassignUsersInDb(roleId);
    return { message: "Rol eliminado. Usuarios reasignados al rol base." };
  } catch (error: any) {
    throw new AppError(error.message || "Error al eliminar el rol", 403);
  }
}