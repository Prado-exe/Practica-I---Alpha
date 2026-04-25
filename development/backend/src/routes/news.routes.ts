import type { HttpRequest, HttpResponse } from "../types/http";
import { tryGetAuthPayload } from "../utils/auth";
import { createNewsPost, getPublicNews } from "../services/news.service"; // Asegúrate de que el servicio exista

// 👇 IMPORTS CORREGIDOS SEGÚN TU ARQUITECTURA REAL
import { sendJson } from "../utils/json"; 
import { readJsonBody } from "../utils/body";
import { getErrorStatus, getErrorMessage } from "./auth.routes"; 

/**
 * Controlador para crear una nueva noticia
 */
export async function createNewsAction(req: HttpRequest, res: HttpResponse) {
  try {
    const payload = tryGetAuthPayload(req);
    // En tu sistema, el ID del usuario viene en payload.sub
    const accountId = Number(payload?.sub); 
    
    if (!accountId || isNaN(accountId)) {
        return sendJson(res, 401, { ok: false, message: "No autorizado" });
    }

    // 👇 En tu proyecto, el body se lee con esta utilidad asíncrona, NO con req.body
    const body = await readJsonBody<any>(req);

    const result = await createNewsPost(body, accountId);
    
    sendJson(res, 201, { ok: true, message: "Noticia creada con éxito", data: result });
  } catch (error: any) {
    // 👇 Usando tus utilidades centralizadas de error
    console.error("❌ Error en createNewsAction:", error);
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

/**
 * Controlador para obtener las noticias públicas
 */
export async function getPublicNewsAction(req: HttpRequest, res: HttpResponse) {
  try {
    const news = await getPublicNews();
    sendJson(res, 200, { ok: true, data: news });
  } catch (error: any) {
    console.error("❌ Error en getPublicNewsAction:", error);
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}