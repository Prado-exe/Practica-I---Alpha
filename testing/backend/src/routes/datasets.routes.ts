import { createDataset, getDatasets, getDatasetById, removeDataset, editDataset } from "../services/datasets.service";
import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson } from "../utils/json";
import { readJsonBody } from "../utils/body";
import { getErrorStatus, getErrorMessage } from "./auth.routes";
import { AppError } from "../types/app-error";
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

    const result = await getDatasets(accountId, isAdmin, search, page, limit);
    sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function createDatasetAction(req: HttpRequest, res: HttpResponse) {
  try {
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
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}