import { ZodError } from "zod";
import type { HttpRequest, HttpResponse } from "../types/http";
import { AppError } from "../types/app-error";
import { readJsonBody } from "../utils/body";
import { sendJson } from "../utils/json";
import { Router } from "../utils/router";
import {
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  verifyCodeSchema,
} from "../validators/auth.validators";
import {
  loginUser,
  logoutUser,
  refreshUserSession,
  registerUser,
  resendVerificationCode,
  verifyEmailCode,
  requestPasswordReset, 
  executePasswordReset
} from "../services/auth.service";
import { tryGetAuthPayload } from "../utils/auth";
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from "../utils/cookies";
import { parseCookies } from "../utils/request-cookies";
import { verifyRefreshToken } from "../utils/jwt";

function getErrorStatus(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return 500;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  
  console.error("[Unhandled Error]:", error);
  return "Error interno del servidor";
}

function getSessionIdFromRequest(req: HttpRequest): number | null {
  const accessPayload = tryGetAuthPayload(req);

  if (accessPayload?.sessionId) {
    return accessPayload.sessionId;
  }

  const cookies = parseCookies(req);
  const refreshToken = cookies.refreshToken;

  if (!refreshToken) {
    return null;
  }

  try {
    const refreshPayload = verifyRefreshToken(refreshToken);
    return refreshPayload.sessionId;
  } catch {
    return null;
  }
}

export const authRouter = new Router();

authRouter.add("POST", "/api/register", [], async (req, res) => {
  try {
    const body = await readJsonBody<unknown>(req);
    const payload = registerSchema.parse(body);
    const result = await registerUser(payload);

    sendJson(res, 201, {
      ok: true,
      message: result.message,
      account: result.account,
      verification: result.verification,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      sendJson(res, 400, {
        ok: false,
        message: "Datos inválidos",
        errors: error.issues,
      });
      return;
    }

    sendJson(res, getErrorStatus(error), {
      ok: false,
      message: getErrorMessage(error),
    });
  }
});

authRouter.add("POST", "/api/login", [], async (req, res) => {
  try {
    const body = await readJsonBody<unknown>(req);
    const payload = loginSchema.parse(body);

    const result = await loginUser(payload, {
      ipAddress: req.socket.remoteAddress ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });

    // 👇 1. EVALUAMOS SI EL USUARIO CAYÓ EN LA TRAMPA DE REVALIDACIÓN
    if ("requiresRevalidation" in result) {
      sendJson(res, 200, {
        ok: true,
        requiresRevalidation: true,
        email: result.email,
        message: result.message,
      });
      return; // Cortamos la ejecución aquí
    }

    // 👇 2. SI FUE UN LOGIN NORMAL, SETEAMOS LA COOKIE
    setRefreshTokenCookie(res, result.refreshToken);

    sendJson(res, 200, {
      ok: true,
      message: result.message,
      token: result.accessToken,
      account: result.account,
      expiresAt: result.accessExpiresAt,
    });
  } catch (error) {
    // === 🚨 AQUÍ ESTÁ EL CAMBIO PARA DEPURAR 🚨 ===
    // Esto imprimirá en la terminal de tu backend la causa real del error 500
    console.error("🚨 DEBUG: Error en /api/login:", error);

    if (error instanceof ZodError) {
      sendJson(res, 400, {
        ok: false,
        message: "Datos inválidos",
        errors: error.issues,
      });
      return;
    }

    sendJson(res, getErrorStatus(error), {
      ok: false,
      message: getErrorMessage(error),
    });
  }
});

authRouter.add("POST", "/api/verificar", [], async (req, res) => {
  try {
    const body = await readJsonBody<unknown>(req);
    const payload = verifyCodeSchema.parse(body);
    const result = await verifyEmailCode(payload);

    sendJson(res, 200, result);
  } catch (error) {
    if (error instanceof ZodError) {
      sendJson(res, 400, {
        valid: false,
        message: "Datos inválidos",
        errors: error.issues,
      });
      return;
    }

    sendJson(res, getErrorStatus(error), {
      valid: false,
      message: getErrorMessage(error),
    });
  }
});

authRouter.add("POST", "/api/verificar/reenviar", [], async (req, res) => {
  try {
    const body = await readJsonBody<unknown>(req);
    const payload = resendVerificationSchema.parse(body);

    const result = await resendVerificationCode(payload.email);

    sendJson(res, 200, {
      ok: true,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      sendJson(res, 400, {
        ok: false,
        message: "Datos inválidos",
        errors: error.issues,
      });
      return;
    }

    sendJson(res, getErrorStatus(error), {
      ok: false,
      message: getErrorMessage(error),
    });
  }
});

authRouter.add("POST", "/api/refresh", [], async (req, res) => {
  if (req.method === "POST" && req.url === "/api/refresh") {
    console.log("=== [DEBUG] INICIANDO PETICIÓN DE REFRESH ===");
    try {
      // 1. Ver qué cookies llegaron realmente al servidor
      const cookies = parseCookies(req);
      console.log("🔍 Cookies recibidas en el request:", cookies);

      const refreshToken = cookies.refreshToken;

      if (!refreshToken) {
        console.log("❌ FALLO: El frontend no envió el refreshToken");
        sendJson(res, 401, {
          ok: false,
          message: "Refresh token no encontrado",
        });
        return true;
      }

      console.log("✅ Token recibido. Intentando validar en base de datos...");

      // 2. Ver si la validación falla internamente
      const result = await refreshUserSession(refreshToken, {
        ipAddress: req.socket.remoteAddress ?? null,
        userAgent: req.headers["user-agent"] ?? null,
      });

      console.log("✅ Sesión renovada exitosamente para el usuario:", result.account.email);

      setRefreshTokenCookie(res, result.refreshToken);

      sendJson(res, 200, {
        ok: true,
        message: result.message,
        token: result.accessToken,
        account: result.account,
        expiresAt: result.accessExpiresAt,
      });
      return true;
    } catch (error) {
      // 3. Capturar el error exacto si el token es inválido o expiró
      console.error("❌ ERROR INTERNO EN REFRESH:", error);
      
      clearRefreshTokenCookie(res);

      sendJson(res, getErrorStatus(error), {
        ok: false,
        message: getErrorMessage(error),
      });
      return true;
    }
  }
});

authRouter.add("POST", "/api/logout", [], async (req, res) => {
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
});


authRouter.add("POST", "/api/recuperar-password", [], async (req, res) => {
  try {
    const body = await readJsonBody<{ email: string }>(req);
    
    if (!body.email) {
      sendJson(res, 400, { ok: false, message: "El correo es obligatorio" });
      return;
    }

 
    const result = await requestPasswordReset(body.email as string);
    
    sendJson(res, 200, { ok: true, message: result.message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), {
      ok: false,
      message: getErrorMessage(error),
    });
  }
});

authRouter.add("POST", "/api/reset-password", [], async (req, res) => {
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
});