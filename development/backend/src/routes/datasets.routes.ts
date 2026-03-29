import { getDatasets, createDataset } from "../services/datasets.service";
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