import type { HttpRequest, HttpResponse } from "../types/http";
import { tryGetAuthPayload } from "../utils/auth";
import {
  createNewsPost,
  getPublicNews,
  getCarouselSlides,
  getAllCarouselSlidesAdmin,
  createCarouselSlide,
  updateCarouselSlide,
  deleteCarouselSlide
} from "../services/news.service";

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

// =====================================================
// CAROUSEL CONTROLLERS
// =====================================================

export async function getPublicCarouselAction(req: HttpRequest, res: HttpResponse) {
  try {
    const slides = await getCarouselSlides();
    sendJson(res, 200, { ok: true, data: slides });
  } catch (error: any) {
    console.error("❌ Error en getPublicCarouselAction:", error);
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function getAdminCarouselAction(req: HttpRequest, res: HttpResponse) {
  try {
    const slides = await getAllCarouselSlidesAdmin();
    sendJson(res, 200, { ok: true, data: slides });
  } catch (error: any) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function createCarouselSlideAction(req: HttpRequest, res: HttpResponse) {
  try {
    const payload = tryGetAuthPayload(req);
    const accountId = Number(payload?.sub);
    if (!accountId || isNaN(accountId)) return sendJson(res, 401, { ok: false, message: "No autorizado" });

    const body = await readJsonBody<any>(req);
    const result = await createCarouselSlide(body, accountId);
    sendJson(res, 201, { ok: true, data: result });
  } catch (error: any) {
    console.error("❌ Error en createCarouselSlideAction:", error);
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function updateCarouselSlideAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });

    const body = await readJsonBody<any>(req);
    const result = await updateCarouselSlide(id, body);
    sendJson(res, 200, { ok: true, data: result });
  } catch (error: any) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function deleteCarouselSlideAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });

    await deleteCarouselSlide(id);
    sendJson(res, 200, { ok: true, message: "Slide eliminado" });
  } catch (error: any) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}