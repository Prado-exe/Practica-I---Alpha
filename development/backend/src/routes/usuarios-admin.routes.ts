// src/routes/usuarios-admin.routes.ts
import type { HttpRequest, HttpResponse } from "../types/http";
import { readJsonBody } from "../utils/body";
import { sendJson } from "../utils/json";
import { getErrorStatus, getErrorMessage } from "./auth.routes";

// IMPORTANTE: Deberás crear estas 3 funciones en tu archivo auth.service.ts
import { getAllUsers, updateUserStatus, deleteUser } from "../services/auth.service";

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