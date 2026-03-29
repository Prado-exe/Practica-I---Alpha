<<<<<<< HEAD
import { createDataset, getDatasets, getDatasetById, removeDataset, editDataset } from "../services/datasets.service";
=======
import { getDatasets, createDataset } from "../services/datasets.service";
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson } from "../utils/json";
import { readJsonBody } from "../utils/body";
import { getErrorStatus, getErrorMessage } from "./auth.routes";
import { AppError } from "../types/app-error";
<<<<<<< HEAD
import { tryGetAuthPayload } from "../utils/auth";


export async function getDatasetsAction(req: HttpRequest, res: HttpResponse) {
  try {
    const accountId = Number((req as any).user.sub);
    const permissions = (req as any).user.permissions || [];
    const isAdmin = permissions.includes("data_management.read") || permissions.includes("data_management.write");

    const url = new URL(req.url || "", `http://${req.headers?.host || "localhost"}`);
    const search = url.searchParams.get("search") || "";
    
    // Validamos y limpiamos la paginación para evitar que metan letras
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10));
=======

export async function getDatasetsAction(req: HttpRequest, res: HttpResponse) {
  try {
    // req.user viene del middleware requireAuth
    const accountId = Number((req as any).user.sub);
    
    // Verificamos si es admin basándonos en los permisos de su token
    const permissions = (req as any).user.permissions || [];
    const isAdmin = permissions.includes("admin_general.manage");

    const url = new URL(req.url || "", `http://${req.headers?.host || "localhost"}`);
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas

    const result = await getDatasets(accountId, isAdmin, search, page, limit);
    sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function createDatasetAction(req: HttpRequest, res: HttpResponse) {
  try {
<<<<<<< HEAD
    const payload = tryGetAuthPayload(req);
    const accountId = Number(payload?.sub);
    const isAdmin = payload?.role === 'super_admin' || payload?.role === 'data_admin';

    const body = await readJsonBody<any>(req);
    const dataset = await createDataset(accountId, isAdmin, body);

    sendJson(res, 201, { ok: true, message: "Dataset creado como borrador", data: dataset });
  } catch (error) {
    console.error("❌ Error en createDatasetAction:", error);
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

// 1. Acción para "Revisar"
export async function getDatasetByIdAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });

    const dataset = await getDatasetById(id);
    sendJson(res, 200, { ok: true, data: dataset });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

// 2. Acción para "Eliminar"
export async function deleteDatasetAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });

    const payload = tryGetAuthPayload(req);
    const accountId = Number(payload?.sub);

    const result = await removeDataset(id, accountId);
    sendJson(res, 200, { ok: true, message: result.message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

// 3. Acción para "Editar"
export async function updateDatasetAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });

    const payload = tryGetAuthPayload(req);
    const accountId = Number(payload?.sub);
    const body = await readJsonBody<any>(req);

    const result = await editDataset(id, accountId, body);
    sendJson(res, 200, { ok: true, message: "Dataset actualizado", data: result });
=======
    const accountId = Number((req as any).user.sub);
    const permissions = (req as any).user.permissions || [];
    const isAdmin = permissions.includes("admin_general.manage");

    const body = await readJsonBody<any>(req); 
    const newDataset = await createDataset(accountId, isAdmin, body);
    
    const msg = isAdmin ? "Dataset publicado exitosamente" : "Solicitud de creación enviada a revisión";
    sendJson(res, 201, { ok: true, message: msg, data: newDataset });
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}