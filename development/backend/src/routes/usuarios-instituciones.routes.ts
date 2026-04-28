/**
 * ============================================================================
 * MÓDULO: Enrutador de Usuarios e Instituciones (usuarios-instituciones.routes.ts)
 * * PROPÓSITO: Gestionar los endpoints que relacionan las cuentas de usuario
 * con las instituciones (listar miembros y desvincularlos).
 * ============================================================================
 */
import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson } from "../utils/json";
import { readJsonBody } from "../utils/body";
import { getErrorStatus, getErrorMessage } from "./auth.routes"; 
import { getUsersByInstitution, unlinkUser } from "../services/auth.service";

/**
 * Descripción: Obtiene todos los usuarios asociados a una institución específica.
 */
export async function getInstitutionUsersAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });
    
    const users = await getUsersByInstitution(id);
    sendJson(res, 200, { ok: true, data: users });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

/**
 * Descripción: Desvincula a un usuario de su institución actual y opcionalmente degrada su rol.
 */
export async function unlinkUserAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });
    
    // Leemos el cuerpo de la petición para saber si debemos degradar el rol o no
    const body = await readJsonBody<{ degradeRole: boolean }>(req);
    
    const result = await unlinkUser(id, body.degradeRole);
    sendJson(res, 200, { ok: true, message: result.message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}