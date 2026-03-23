import type { HttpRequest, HttpResponse } from "../types/http";
import { readJsonBody } from "../utils/body";
import { sendJson } from "../utils/json";
import { requestPasswordReset, executePasswordReset } from "../services/auth.service";
import { getErrorStatus, getErrorMessage } from "./auth.routes";

export async function requestPasswordResetAction(req: HttpRequest, res: HttpResponse) {
  try {
    const body = await readJsonBody<{ email: string }>(req);
    
    if (!body.email) {
      sendJson(res, 400, { ok: false, message: "El correo es obligatorio" });
      return;
    }

    const result = await requestPasswordReset(body.email);
    
    sendJson(res, 200, { ok: true, message: result.message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), {
      ok: false,
      message: getErrorMessage(error),
    });
  }
}

export async function resetPasswordAction(req: HttpRequest, res: HttpResponse) {
  try {
    const body = await readJsonBody<{ token: string; password: string }>(req);
    
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";
    
    if (!token || !password) {
      sendJson(res, 400, { ok: false, message: "Faltan datos (token o contraseña)" });
      return;
    }

    if (password.length < 8) {
      sendJson(res, 400, { ok: false, message: "La contraseña debe tener al menos 8 caracteres" });
      return;
    }

    const result = await executePasswordReset(token, password);
    
    sendJson(res, 200, { ok: true, message: result.message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), {
      ok: false,
      message: getErrorMessage(error),
    });
  }
}
