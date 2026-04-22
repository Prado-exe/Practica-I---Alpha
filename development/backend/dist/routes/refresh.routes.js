"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshAction = refreshAction;
const json_1 = require("../utils/json");
const request_cookies_1 = require("../utils/request-cookies");
const cookies_1 = require("../utils/cookies");
const auth_service_1 = require("../services/auth.service");
const auth_routes_1 = require("./auth.routes");
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
async function refreshAction(req, res) {
    console.log("=== [DEBUG] INICIANDO PETICIÓN DE REFRESH ===");
    try {
        const cookies = (0, request_cookies_1.parseCookies)(req);
        console.log("🔍 Cookies recibidas en el request:", cookies);
        const refreshToken = cookies.refreshToken;
        if (!refreshToken) {
            console.log("❌ FALLO: El frontend no envió el refreshToken");
            (0, json_1.sendJson)(res, 401, {
                ok: false,
                message: "Refresh token no encontrado",
            });
            return;
        }
        console.log("✅ Token recibido. Intentando validar en base de datos...");
        const result = await (0, auth_service_1.refreshUserSession)(refreshToken, {
            ipAddress: req.socket.remoteAddress ?? null,
            userAgent: req.headers["user-agent"] ?? null,
        });
        console.log("✅ Sesión renovada exitosamente para el usuario:", result.account.email);
        (0, cookies_1.setRefreshTokenCookie)(res, result.refreshToken);
        (0, json_1.sendJson)(res, 200, {
            ok: true,
            message: result.message,
            token: result.accessToken,
            account: result.account,
            expiresAt: result.accessExpiresAt,
        });
    }
    catch (error) {
        console.error("❌ ERROR INTERNO EN REFRESH:", error);
        (0, cookies_1.clearRefreshTokenCookie)(res);
        (0, json_1.sendJson)(res, (0, auth_routes_1.getErrorStatus)(error), {
            ok: false,
            message: (0, auth_routes_1.getErrorMessage)(error),
        });
    }
}
