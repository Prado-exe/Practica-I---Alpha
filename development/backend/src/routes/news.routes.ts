// src/routes/news.routes.ts
import type { HttpRequest, HttpResponse } from "../types/http";
import { tryGetAuthPayload } from "../utils/auth";
import { 
  createNewsPost, 
  updateNewsPost, 
  deleteNewsPost, 
  getPublicNews, 
  getAllNewsAdmin,
  toggleNewsVisibility,
  getNewsCategories,
  getPublicNewsBySlug 
} from "../services/news.service";
import { sendJson } from "../utils/json"; 
import { readJsonBody } from "../utils/body";
import { getErrorStatus, getErrorMessage } from "./auth.routes"; 

// ==========================================
// RUTAS DE ESCRITURA (ADMINISTRADORES)
// ==========================================

export async function createNewsAction(req: HttpRequest, res: HttpResponse) {
  try {
    const accountId = Number(tryGetAuthPayload(req)?.sub); 
    if (!accountId) return sendJson(res, 401, { ok: false, message: "No autorizado" });

    const body = await readJsonBody<any>(req);
    const result = await createNewsPost(body, accountId);
    
    sendJson(res, 201, { ok: true, message: result.message, data: result });
  } catch (error) {
    console.error("❌ Error en createNewsAction:", error);
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function updateNewsAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    const accountId = Number(tryGetAuthPayload(req)?.sub); 
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });

    const body = await readJsonBody<any>(req);
    const result = await updateNewsPost(id, body, accountId);
    
    sendJson(res, 200, { ok: true, message: "Contenido actualizado con éxito", data: result });
  } catch (error: any) {
    console.error("❌ Error CRÍTICO en updateNewsAction:", error); // 👈 ESTO TE SALVARÁ LA VIDA
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function deleteNewsAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });

    const result = await deleteNewsPost(id);
    sendJson(res, 200, { ok: true, message: result.message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

/**
 * Endpoint para Ocultar/Mostrar (hide: true/false)
 */
export async function toggleVisibilityAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });
    
    const body = await readJsonBody<{ hide: boolean }>(req);
    const result = await toggleNewsVisibility(id, body.hide);
    
    sendJson(res, 200, { ok: true, message: result.message, data: result.data });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

// ==========================================
// RUTAS DE LECTURA (PÚBLICO Y ADMIN)
// ==========================================

export async function getPublicNewsAction(req: HttpRequest, res: HttpResponse) {
  try {
    const news = await getPublicNews();
    sendJson(res, 200, { ok: true, data: news });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function getAdminNewsAction(req: HttpRequest, res: HttpResponse) {
  try {
    const news = await getAllNewsAdmin();
    sendJson(res, 200, { ok: true, data: news });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function getNewsCategoriesAction(req: HttpRequest, res: HttpResponse) {
  try {
    const categories = await getNewsCategories();
    sendJson(res, 200, { ok: true, data: categories });
  } catch (error) {
    sendJson(res, 500, { ok: false, message: "Error al obtener categorías" });
  }
}

export async function getPublicNewsBySlugAction(req: HttpRequest, res: HttpResponse) {
  try {
    // 1. Nos aseguramos de que req.url exista. Si no, usamos un string vacío.
    const url = req.url || "";
    
    // 2. Extraemos la última parte de la URL (el slug) ignorando barras finales
    const slug = url.split('/').filter(Boolean).pop();
    
    if (!slug || slug === "news") {
      return sendJson(res, 400, { ok: false, message: "Slug requerido" });
    }

    const newsData = await getPublicNewsBySlug(slug);
    sendJson(res, 200, { ok: true, data: newsData });

  } catch (error: any) {
    const status = error.statusCode || 500;
    sendJson(res, status, { ok: false, message: error.message || "Error interno" });
  }
}

