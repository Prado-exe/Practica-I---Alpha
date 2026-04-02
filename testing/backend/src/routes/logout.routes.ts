/**
 * ============================================================================
 * MÓDULO: Enrutador de Cierre de Sesión (logout.routes.ts)
 * * PROPÓSITO: Exponer el endpoint HTTP para la finalización explícita y 
 * segura de la sesión de un usuario en el sistema.
 * * RESPONSABILIDAD: Coordinar la revocación lógica de la sesión en la base 
 * de datos y asegurar la destrucción de las credenciales (cookies) en el 
 * navegador del cliente.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Diseño Idempotente y "Fail-Safe": El proceso de cierre de sesión está 
 * diseñado para no fallar nunca de cara al usuario. Incluso si la base de 
 * datos está caída, o si la sesión ya había expirado previamente, el sistema 
 * siempre responderá con un HTTP 200 y ordenará borrar la cookie local. 
 * Esto previene el escenario de "Sesión Zombie", donde un usuario queda 
 * atrapado con una cookie válida localmente pero rechazada por el servidor, 
 * sin poder cerrarla.
 * ============================================================================
 */
import type { HttpRequest, HttpResponse } from "../types/http";
import { logoutUser } from "../services/auth.service";
import { clearRefreshTokenCookie } from "../utils/cookies";
import { sendJson } from "../utils/json";
import { getSessionIdFromRequest } from "./auth.routes"; 

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
export async function logoutAction(req: HttpRequest, res: HttpResponse) {
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
}