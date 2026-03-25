import type { HttpRequest, HttpResponse } from "../types/http";
import { readJsonBody } from "../utils/body";
import { sendJson } from "../utils/json";
import { setRefreshTokenCookie } from "../utils/cookies";
import { loginSchema } from "../validators/auth.validators";
import { loginUser } from "../services/auth.service";
// 👇 Importamos tus helpers de errores
import { getErrorStatus, getErrorMessage } from "./auth.routes";

export async function loginAction(req: HttpRequest, res: HttpResponse) {
  try {
    const body = await readJsonBody(req);
    const payload = loginSchema.parse(body);

    const meta = {
      ipAddress: req.socket.remoteAddress || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
    };

    const result = await loginUser(payload, meta);

    // Si tu servicio devuelve requiresRevalidation
    if (result.requiresRevalidation) {
      return sendJson(res, 403, { 
        ok: false, 
        requiresRevalidation: true, 
        message: result.message 
      });
    }

    if (result.refreshToken) {
      setRefreshTokenCookie(res, result.refreshToken);
    }

    sendJson(res, 200, {
      ok: true,
      message: result.message,
      token: result.accessToken,
      account: result.account,
      expiresAt: result.accessExpiresAt,
    });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}