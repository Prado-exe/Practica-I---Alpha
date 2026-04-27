/**
 * ============================================================================
 * MÓDULO: Enrutador de Contacto (contact.routes.ts)
 * * PROPÓSITO: Endpoints para el formulario público y la bandeja de entrada del admin.
 * ============================================================================
 */
import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson } from "../utils/json";
import { readJsonBody } from "../utils/body";
import { getErrorStatus, getErrorMessage } from "./auth.routes"; 
import { 
  submitContactMessage, 
  getAdminContactMessages, 
  markMessageAsRead, 
  removeContactMessage,
  getContactMessageById 
} from "../services/contact.service";

// --- PÚBLICO ---
export async function submitContactAction(req: HttpRequest, res: HttpResponse) {
  try {
    const body = await readJsonBody<any>(req);
    await submitContactMessage(body);
    sendJson(res, 201, { ok: true, message: "Mensaje recibido correctamente" });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

// --- PRIVADO (ADMIN) ---
export async function getContactsAction(req: HttpRequest, res: HttpResponse) {
  try {
    const messages = await getAdminContactMessages();
    sendJson(res, 200, { ok: true, data: messages });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function markContactReadAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });

    await markMessageAsRead(id);
    sendJson(res, 200, { ok: true, message: "Marcado como leído" });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function deleteContactAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });

    const result = await removeContactMessage(id);
    sendJson(res, 200, { ok: true, message: result.message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function getContactByIdAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });

    const message = await getContactMessageById(id);
    sendJson(res, 200, { ok: true, data: message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}