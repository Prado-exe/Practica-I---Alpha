import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson } from "../utils/json";
import { readJsonBody } from "../utils/body";
// Reutilizamos tus funciones de error ya existentes en auth.routes
import { getErrorStatus, getErrorMessage } from "./auth.routes"; 
import {
  getRolesDetails,
  getAllPermissions,
  createNewRole,
  updateExistingRole,
  removeRole
} from "../services/roles.service";

export async function getRolesDetailsAction(req: HttpRequest, res: HttpResponse) {
  try {
    const roles = await getRolesDetails();
    sendJson(res, 200, { ok: true, roles });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function getPermisosAction(req: HttpRequest, res: HttpResponse) {
  try {
    const permisos = await getAllPermissions();
    sendJson(res, 200, { ok: true, permisos });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function createRoleAction(req: HttpRequest, res: HttpResponse) {
  try {
    const body = await readJsonBody<{ code: string, name: string, description: string, permisos: number[] }>(req);
    const result = await createNewRole(body.code, body.name, body.description, body.permisos);
    sendJson(res, 201, { ok: true, message: result.message, roleId: result.roleId });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function updateRoleAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID de rol inválido o requerido" });

    const body = await readJsonBody<{ code: string, name: string, description: string, permisos: number[] }>(req);
    const result = await updateExistingRole(id, body.code, body.name, body.description, body.permisos);
    sendJson(res, 200, { ok: true, message: result.message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function deleteRoleAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID de rol inválido o requerido" });

    const result = await removeRole(id);
    sendJson(res, 200, { ok: true, message: result.message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}