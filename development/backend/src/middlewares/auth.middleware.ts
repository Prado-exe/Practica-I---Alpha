import type { HttpRequest, HttpResponse } from "../types/http";
import { requireAuth } from "../utils/auth";
import { sendJson } from "../utils/json";
import { AppError } from "../types/app-error";

export async function authMiddleware(req: HttpRequest, res: HttpResponse): Promise<boolean | void> {
  try {
    const payload = await requireAuth(req);
    
    req.user = payload; 
    
    return; 
  } catch (error) {
    const status = error instanceof AppError ? error.statusCode : 401;
    const message = error instanceof AppError ? error.message : "No autorizado";
    
    sendJson(res, status, { ok: false, message });
    return true; 
  }
}