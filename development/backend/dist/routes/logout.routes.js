"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutAction = logoutAction;
const auth_service_1 = require("../services/auth.service");
const cookies_1 = require("../utils/cookies");
const json_1 = require("../utils/json");
const auth_routes_1 = require("./auth.routes");
/**
 * Descripción: Controlador que ejecuta el cierre de sesión eliminando el rastro tanto en el cliente como en el servidor.
 * POR QUÉ: Se implementa un doble bloque `try/catch`. El bloque interno envuelve la llamada a la base de datos (`logoutUser`); si esta falla (ej. red caída), solo emite un `console.warn` y permite que la ejecución continúe. El bloque externo actúa como una red de seguridad absoluta: ante cualquier error imprevisto (ej. fallo al extraer el `sessionId`), el `catch` intercepta el fallo, fuerza la eliminación de la cookie y devuelve un 200 OK de todos modos, priorizando la limpieza del lado del cliente.
 * * FLUJO:
 * 1. Intenta extraer el identificador de sesión (`sessionId`) de la petición actual.
 * 2. Si existe, solicita al servicio que marque esa sesión como revocada (`is_revoked = TRUE`) en la base de datos.
 * 3. Ejecuta `clearRefreshTokenCookie` para instruir al navegador la eliminación de la cookie de seguridad.
 * 4. Devuelve un JSON de éxito estandarizado, sin importar los fallos silenciados anteriores.
 * * @openapi
 * /api/logout:
 * post:
 * summary: Cerrar la sesión actual
 * description: Invalida el Refresh Token en la base de datos y elimina las cookies seguras del navegador del usuario. Este endpoint es altamente resiliente y siempre devuelve éxito.
 * tags:
 * - Autenticación
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Sesión cerrada correctamente. El cliente debe limpiar cualquier Access Token que tenga en memoria (ej. Zustand, Redux).
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna} Por diseño, este endpoint atrapa y silencia todas las excepciones para garantizar la limpieza de la sesión en el cliente.
 */
async function logoutAction(req, res) {
    try {
        const sessionId = (0, auth_routes_1.getSessionIdFromRequest)(req);
        if (sessionId) {
            try {
                await (0, auth_service_1.logoutUser)(sessionId);
            }
            catch (error) {
                console.warn("No se pudo revocar la sesión en logout:", error);
            }
        }
        (0, cookies_1.clearRefreshTokenCookie)(res);
        (0, json_1.sendJson)(res, 200, {
            ok: true,
            message: "Sesión cerrada correctamente",
        });
    }
    catch {
        (0, cookies_1.clearRefreshTokenCookie)(res);
        (0, json_1.sendJson)(res, 200, {
            ok: true,
            message: "Sesión cerrada correctamente",
        });
    }
}
