// src/routes/usuarios-admin.routes.ts
import type { HttpRequest, HttpResponse } from "../types/http";
import { readJsonBody } from "../utils/body";
import { sendJson } from "../utils/json";
import { getErrorStatus, getErrorMessage} from "./auth.routes";

// IMPORTANTE: Deberás crear estas 3 funciones en tu archivo auth.service.ts
import { getAllUsers, updateUserStatus, deleteUser, editUserAdmin, getActiveRoles  } from "../services/auth.service";


export async function getUsuariosAction(req: HttpRequest, res: HttpResponse) {
  try {
    const usuarios = await getAllUsers();
    sendJson(res, 200, { ok: true, usuarios });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function toggleEstadoAction(req: HttpRequest, res: HttpResponse) {
  try {
    // Ajusta esto dependiendo de cómo tu Router personalizado extrae los parámetros de la URL
    // A veces es req.params.id, otras veces hay que sacarlo del string de la URL
    const id = (req as any).params?.id; 
    
    if (!id) {
      sendJson(res, 400, { ok: false, message: "ID de usuario requerido" });
      return;
    }

    const body = await readJsonBody<{ estado: string }>(req);
    const result = await updateUserStatus(id, body.estado);

    sendJson(res, 200, { ok: true, message: result.message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function deleteUsuarioAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = (req as any).params?.id;
    
    if (!id) {
      sendJson(res, 400, { ok: false, message: "ID de usuario requerido" });
      return;
    }

    const result = await deleteUser(id);

    sendJson(res, 200, { ok: true, message: result.message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function editUsuarioAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = (req as any).params?.id; 
    
    if (!id) {
      sendJson(res, 400, { ok: false, message: "ID de usuario requerido" });
      return;
    }

    // Agregamos role_code a los datos esperados
    const body = await readJsonBody<{ full_name: string, email: string, role_code: string, password?: string }>(req);
    
    if (!body.role_code) {
      sendJson(res, 400, { ok: false, message: "El rol es obligatorio" });
      return;
    }

    const result = await editUserAdmin(id, body.full_name, body.email, body.role_code, body.password);
    
    sendJson(res, 200, { ok: true, message: result.message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function getRolesAction(req: HttpRequest, res: HttpResponse) {
  try {
    const roles = await getActiveRoles();
    sendJson(res, 200, { ok: true, roles });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}