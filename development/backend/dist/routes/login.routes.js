"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginAction = loginAction;
const body_1 = require("../utils/body");
const json_1 = require("../utils/json");
const cookies_1 = require("../utils/cookies");
const auth_validators_1 = require("../validators/auth.validators");
const auth_service_1 = require("../services/auth.service");
const auth_routes_1 = require("./auth.routes");
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
async function loginAction(req, res) {
    try {
        const body = await (0, body_1.readJsonBody)(req);
        const payload = auth_validators_1.loginSchema.parse(body);
        const meta = {
            ipAddress: req.socket.remoteAddress || "unknown",
            userAgent: req.headers["user-agent"] || "unknown",
        };
        const result = await (0, auth_service_1.loginUser)(payload, meta);
        if (result.requiresRevalidation) {
            return (0, json_1.sendJson)(res, 403, {
                ok: false,
                requiresRevalidation: true,
                message: result.message
            });
        }
        if (result.refreshToken) {
            (0, cookies_1.setRefreshTokenCookie)(res, result.refreshToken);
        }
        (0, json_1.sendJson)(res, 200, {
            ok: true,
            message: result.message,
            token: result.accessToken,
            account: result.account,
            expiresAt: result.accessExpiresAt,
        });
    }
    catch (error) {
        (0, json_1.sendJson)(res, (0, auth_routes_1.getErrorStatus)(error), { ok: false, message: (0, auth_routes_1.getErrorMessage)(error) });
    }
}
