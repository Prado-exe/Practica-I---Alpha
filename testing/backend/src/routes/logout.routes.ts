import type { HttpRequest, HttpResponse } from "../types/http";
import { logoutUser } from "../services/auth.service";
import { clearRefreshTokenCookie } from "../utils/cookies";
import { sendJson } from "../utils/json";
import { getSessionIdFromRequest } from "./auth.routes"; 

export async function logoutAction(req: HttpRequest, res: HttpResponse) {
  try {
    const sessionId = getSessionIdFromRequest(req);

    if (sessionId) {
      try {
        await logoutUser(sessionId);
      } catch (error) {
        console.warn("No se pudo revocar la sesión en logout:", error);
      }
    }

    clearRefreshTokenCookie(res);

    sendJson(res, 200, {
      ok: true,
      message: "Sesión cerrada correctamente",
    });
  } catch {
    clearRefreshTokenCookie(res);

    sendJson(res, 200, {
      ok: true,
      message: "Sesión cerrada correctamente",
    });
  }
}