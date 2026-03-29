/**
 * ============================================================================
 * MÓDULO: Enrutador de Renovación de Sesión (refresh.routes.ts)
 * * PROPÓSITO: Exponer el endpoint HTTP para la renovación silenciosa de los 
 * tokens de acceso (Access Tokens) utilizando un Refresh Token vigente.
 * * RESPONSABILIDAD: Extraer el token de las cookies de la petición, delegar 
 * la rotación criptográfica al servicio de autenticación y gestionar el ciclo 
 * de vida de la cookie en el navegador del cliente (renovación o destrucción).
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Extracción Segura: A diferencia de otros endpoints que leen un JSON body, 
 * este controlador busca el token exclusivamente en las cookies parseadas 
 * (`parseCookies`). Esto se alinea con la estrategia de mitigación de XSS 
 * mediante cookies `HttpOnly`.
 * - Destrucción Proactiva (Fail-Safe): Si el servicio detecta cualquier 
 * anomalía (token expirado, manipulado, o reutilizado), el bloque `catch` 
 * fuerza la limpieza de la cookie en el cliente (`clearRefreshTokenCookie`) 
 * para garantizar un cierre de sesión seguro a nivel de navegador.
 * ============================================================================
 */
import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson } from "../utils/json";
import { parseCookies } from "../utils/request-cookies";
import { setRefreshTokenCookie, clearRefreshTokenCookie } from "../utils/cookies";
import { refreshUserSession } from "../services/auth.service";
import { getErrorStatus, getErrorMessage } from "./auth.routes";

/**
 * Descripción: Controlador que gestiona el ciclo de "Refresh Token Rotation" para mantener la sesión del usuario viva.
 * POR QUÉ: Extrae y envía metadatos de red (IP y User-Agent) al servicio subyacente de forma obligatoria. Esto permite al servicio de autenticación rastrear desde dónde se está solicitando la renovación y activar alertas o bloqueos si detecta un cambio brusco (ej. robo de sesión).
 * * FLUJO:
 * 1. Extrae las cookies de la cabecera HTTP de la petición.
 * 2. Verifica la presencia del `refreshToken`. Falla rápidamente con 401 si no está.
 * 3. Llama al servicio de autenticación para validar la firma, vigencia y rotar los identificadores en la Base de Datos.
 * 4. Inyecta el nuevo Refresh Token en una cookie segura (`setRefreshTokenCookie`).
 * 5. Devuelve el nuevo Access Token y los datos del usuario en el cuerpo JSON.
 * 6. En caso de error, limpia la cookie para destruir la sesión local del cliente y devuelve el estado de error.
 * * @openapi
 * /api/refresh:
 * post:
 * summary: Renovar el Token de Acceso (Access Token)
 * description: |
 * Intercambia un Refresh Token válido (leído automáticamente desde las cookies seguras del navegador) por un nuevo Access Token. 
 * Además, implementa rotación del Refresh Token emitiendo una nueva cookie en cada llamada exitosa.
 * * *Nota:* Este endpoint no espera parámetros en el cuerpo JSON. El token debe venir inyectado en la cabecera de cookies.
 * tags:
 * - Autenticación
 * responses:
 * 200:
 * description: Sesión renovada con éxito. Devuelve el nuevo Access Token en el JSON y actualiza la cookie del Refresh Token.
 * 401:
 * description: Renovación denegada. El token expiró, no fue enviado en las cookies, o se detectó reutilización maliciosa. La cookie local es eliminada.
 * 403:
 * description: La cuenta del usuario fue desactivada o requiere revalidación.
 * 404:
 * description: La sesión subyacente no existe en la base de datos.
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna} Errores manejados internamente; muta la respuesta HTTP limpiando cookies si es necesario.
 */
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