import type { HttpRequest, HttpResponse } from "../types/http";
import { readJsonBody } from "../utils/body";
import { sendJson } from "../utils/json";
import { setRefreshTokenCookie } from "../utils/cookies";
import { loginSchema } from "../validators/auth.validators";
import { loginUser } from "../services/auth.service";
import { getErrorStatus, getErrorMessage } from "./auth.routes";

/**
 * Controlador para el inicio de sesión de usuarios (Módulo de Autenticación).
 * * FLUJO DE EJECUCIÓN:
 * 1. Recepción y Validación: Parsea el body y valida estrictamente con `loginSchema`.
 * 2. Captura de Metadatos: Extrae IP y User-Agent para auditoría de seguridad.
 * 3. Procesamiento: Llama a `loginUser` para verificar hash, estado y generar JWTs.
 * 4. Intercepción (Re-validación): Si la cuenta requiere acción (ej. cambiar password), retorna 403.
 * 5. Emisión: Inyecta el Refresh Token en una Cookie HttpOnly y devuelve el Access Token en el JSON.
 * * @openapi
 * /api/login:
 * post:
 * summary: Iniciar sesión en el Observatorio
 * description: |
 * **Flujo de Inicio de Sesión y Seguridad**
 * * Este endpoint es la puerta de entrada principal. Verifica las credenciales del usuario, captura metadatos (IP, User-Agent) para auditoría, y establece una sesión segura utilizando un sistema de doble token.
 * * - **Access Token:** Se devuelve en el cuerpo de la respuesta para uso temporal en el frontend.
 * - **Refresh Token:** Se inyecta de forma silenciosa en una cookie `HttpOnly` para prevenir ataques XSS.
 * * *Nota:* Si la cuenta requiere acciones adicionales (como un cambio de contraseña obligatorio), el flujo se interrumpirá con un estado `403 Prohibido`.
 * tags:
 * - Autenticación
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * properties:
 * email:
 * type: string
 * format: email
 * example: "usuario@institucion.com"
 * password:
 * type: string
 * example: "MiPasswordSeguro123"
 * responses:
 * 200:
 * description: Inicio de sesión exitoso. Devuelve el Access Token y los datos de la cuenta.
 * 400:
 * description: Error de validación (correo mal formado) o credenciales incorrectas.
 * 403:
 * description: La cuenta requiere re-validación (ej. contraseña expirada, cuenta inactiva o bloqueada).
 */

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