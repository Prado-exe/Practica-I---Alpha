<<<<<<< HEAD
/**
 * ============================================================================
 * MÓDULO: Enrutador de Inicio de Sesión (login.routes.ts)
 * * PROPÓSITO: Gestionar el punto de entrada principal para la autenticación 
 * de usuarios en el Observatorio.
 * * RESPONSABILIDAD: Validar credenciales, capturar metadatos de conexión para 
 * auditoría y establecer la sesión mediante una estrategia de doble token.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Seguridad por Cookies: El Refresh Token se inyecta en una cookie `HttpOnly` 
 * para mitigar ataques XSS, mientras que el Access Token se entrega en el JSON 
 * para manejo volátil en memoria del frontend.
 * - Intercepción de Seguridad: El flujo se interrumpe con un estado 403 si la 
 * cuenta entra en un estado de "re-validación" (ej. bloqueo por intentos o 
 * cambio de clave obligatorio), delegando la resolución a una vista secundaria 
 * en el cliente.
 * ============================================================================
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
import type { HttpRequest, HttpResponse } from "../types/http";
import { readJsonBody } from "../utils/body";
import { sendJson } from "../utils/json";
import { setRefreshTokenCookie } from "../utils/cookies";
import { loginSchema } from "../validators/auth.validators";
import { loginUser } from "../services/auth.service";
<<<<<<< HEAD
import { getErrorStatus, getErrorMessage } from "./auth.routes";

/**
 * Descripción: Controlador que orquesta el flujo de autenticación, validación de esquema y captura de metadatos.
 * POR QUÉ: Se extraen activamente la IP y el User-Agent (`meta`) antes de llamar al servicio para alimentar el sistema de detección de anomalías y auditoría forense. El uso de `setRefreshTokenCookie` dentro de este controlador asegura que la persistencia de la sesión se gestione a nivel de cabeceras HTTP antes de enviar la respuesta final al cliente.
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
 * password:
 * type: string
 * responses:
 * 200:
 * description: Inicio de sesión exitoso.
 * 403:
 * description: La cuenta requiere re-validación o está bloqueada.
 * * @param req {HttpRequest} Petición entrante, incluye cabeceras y socket para metadatos.
 * @param res {HttpResponse} Respuesta saliente, utilizada para inyectar cookies y JSON.
 * @return {Promise<void>} 
 * @throws {Error} Errores de validación de esquema o credenciales incorrectas (mapeados a HTTP 400/401).
 */
=======
// 👇 Importamos tus helpers de errores
import { getErrorStatus, getErrorMessage } from "./auth.routes";

>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function loginAction(req: HttpRequest, res: HttpResponse) {
  try {
    const body = await readJsonBody(req);
    const payload = loginSchema.parse(body);

    const meta = {
      ipAddress: req.socket.remoteAddress || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
    };

    const result = await loginUser(payload, meta);

<<<<<<< HEAD
=======
    // Si tu servicio devuelve requiresRevalidation
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
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