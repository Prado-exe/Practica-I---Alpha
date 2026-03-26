import { getDatasets, createDataset } from "../services/datasets.service";
import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson } from "../utils/json";
import { readJsonBody } from "../utils/body";
import { getErrorStatus, getErrorMessage } from "./auth.routes";
import { AppError } from "../types/app-error";

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

    const result = await getDatasets(accountId, isAdmin, search, page, limit);
    sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function createDatasetAction(req: HttpRequest, res: HttpResponse) {
  try {
    const accountId = Number((req as any).user.sub);
    const permissions = (req as any).user.permissions || [];
    const isAdmin = permissions.includes("admin_general.manage");

    const body = await readJsonBody<any>(req); 
    const newDataset = await createDataset(accountId, isAdmin, body);
    
    const msg = isAdmin ? "Dataset publicado exitosamente" : "Solicitud de creación enviada a revisión";
    sendJson(res, 201, { ok: true, message: msg, data: newDataset });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}