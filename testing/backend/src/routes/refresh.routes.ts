import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson } from "../utils/json";
import { parseCookies } from "../utils/request-cookies";
import { setRefreshTokenCookie, clearRefreshTokenCookie } from "../utils/cookies";
import { refreshUserSession } from "../services/auth.service";
import { getErrorStatus, getErrorMessage } from "./auth.routes";

export async function refreshAction(req: HttpRequest, res: HttpResponse) {
  console.log("=== [DEBUG] INICIANDO PETICIÓN DE REFRESH ===");
  try {
    const cookies = parseCookies(req);
    console.log("🔍 Cookies recibidas en el request:", cookies);
    const refreshToken = cookies.refreshToken;
    if (!refreshToken) {
      console.log("❌ FALLO: El frontend no envió el refreshToken");
      sendJson(res, 401, {
        ok: false,
        message: "Refresh token no encontrado",
      });
      return;
    }
    console.log("✅ Token recibido. Intentando validar en base de datos...");
    const result = await refreshUserSession(refreshToken, {
      ipAddress: req.socket.remoteAddress ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    console.log("✅ Sesión renovada exitosamente para el usuario:", result.account.email);
    // Ajusta si tu función pide el ExpiresAt (result.refreshExpiresAt)
    setRefreshTokenCookie(res, result.refreshToken);
    sendJson(res, 200, {
      ok: true,
      message: result.message,
      token: result.accessToken,
      account: result.account,
      expiresAt: result.accessExpiresAt,
    });
  } catch (error) {
    console.error("❌ ERROR INTERNO EN REFRESH:", error);
    clearRefreshTokenCookie(res);
    sendJson(res, getErrorStatus(error), {
      ok: false,
      message: getErrorMessage(error),
    });
  }
}