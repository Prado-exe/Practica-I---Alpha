"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requirePermission = requirePermission;
exports.requireLogin = requireLogin;
const auth_1 = require("../utils/auth");
const json_1 = require("../utils/json");
const app_error_1 = require("../types/app-error");
/**
 * Descripción: Valida la identidad del usuario procesando el token de acceso.
 * POR QUÉ: Actúa como la capa base de confianza. Se separa de la lógica de permisos para poder ser reutilizada en endpoints que solo requieren saber quién es el usuario (ej: perfil propio) sin importar sus roles específicos. Captura errores de tipo `AppError` para mapear fallos de expiración o firma de token a estados HTTP semánticos (401/403).
 * @param {HttpRequest} req Objeto de petición donde se inyectará el contexto `user`.
 * @param {HttpResponse} res Objeto de respuesta para emitir fallos de autenticación.
 * @return {Promise<boolean | void>} Retorna `true` si la autenticación falló y se envió una respuesta, de lo contrario no retorna nada para continuar el flujo.
 * @throws {AppError} Si el token es inválido o ha expirado.
 */
async function authMiddleware(req, res) {
    try {
        const payload = await (0, auth_1.requireAuth)(req);
        req.user = payload;
        return;
    }
    catch (error) {
        const status = error instanceof app_error_1.AppError ? error.statusCode : 401;
        const message = error instanceof app_error_1.AppError ? error.message : "No autorizado";
        (0, json_1.sendJson)(res, status, { ok: false, message });
        return true;
    }
}
/**
 * Descripción: Implementa el control de acceso basado en permisos (RBAC).
 * POR QUÉ: Es una función de orden superior (HOC) que permite declarar requisitos de seguridad de forma legible en el enrutador. Ejecuta primero `authMiddleware` para garantizar que el usuario existe antes de evaluar su matriz de permisos. Esta jerarquía evita comprobaciones de permisos sobre usuarios anónimos.
 * @param {string} requiredPermission Nombre técnico del permiso requerido (ej: 'user_management.read').
 * @return {Function} Middleware asíncrono configurado para el permiso solicitado.
 * @throws {Ninguna} Las excepciones de identidad son manejadas por el middleware interno; las de autorización retornan un HTTP 403.
 */
function requirePermission(requiredPermission) {
    return async (req, res) => {
        const isUnauthorized = await authMiddleware(req, res);
        if (isUnauthorized)
            return true;
        const userPermissions = req.user?.permissions || [];
        if (!userPermissions.includes(requiredPermission)) {
            (0, json_1.sendJson)(res, 403, {
                ok: false,
                message: "Acceso denegado: Permisos insuficientes."
            });
            return true;
        }
        return;
    };
}
/**
 * Descripción: Middleware simplificado para rutas que solo requieren una sesión activa.
 * POR QUÉ: Provee una interfaz más limpia para el enrutador cuando no se necesita granularidad de permisos. Funciona como un alias semántico de `authMiddleware` para mejorar la legibilidad del mapa de rutas.
 * @param {HttpRequest} req Petición entrante.
 * @param {HttpResponse} res Respuesta para casos de error.
 * @return {Promise<boolean | void>} Control de flujo para el router.
 * @throws {Ninguna}
 */
async function requireLogin(req, res) {
    const isUnauthorized = await authMiddleware(req, res);
    if (isUnauthorized)
        return true;
    return;
}
