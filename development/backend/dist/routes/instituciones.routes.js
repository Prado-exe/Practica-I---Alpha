"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstitucionesAction = getInstitucionesAction;
exports.createInstitucionAction = createInstitucionAction;
exports.updateInstitucionAction = updateInstitucionAction;
exports.deleteInstitucionAction = deleteInstitucionAction;
exports.getPublicInstitucionesAction = getPublicInstitucionesAction;
const json_1 = require("../utils/json");
const body_1 = require("../utils/body");
const auth_routes_1 = require("./auth.routes");
const instituciones_service_1 = require("../services/instituciones.service");
const auth_1 = require("../utils/auth");
/**
 * Descripción: Recupera el listado completo de instituciones para la vista administrativa.
 * POR QUÉ: A diferencia de la ruta pública, este endpoint devuelve la colección íntegra sin filtros de acceso, permitiendo que los administradores tengan una visión global de todas las entidades registradas, independientemente de su estado o nivel de visibilidad.
 * @param req {HttpRequest} Objeto de petición.
 * @param res {HttpResponse} Objeto de respuesta.
 * @return {Promise<void>} Envía un JSON con el array de instituciones.
 * @throws {Ninguna} Errores capturados y procesados por `getErrorStatus`.
 */
async function getInstitucionesAction(req, res) {
    try {
        const instituciones = await (0, instituciones_service_1.getInstitutions)();
        (0, json_1.sendJson)(res, 200, { ok: true, instituciones });
    }
    catch (error) {
        console.error("❌ Error en getAllCategoriesAction:", error); // AGREGAR ESTO
        (0, json_1.sendJson)(res, (0, auth_routes_1.getErrorStatus)(error), { ok: false, message: (0, auth_routes_1.getErrorMessage)(error) });
    }
}
/**
 * Descripción: Procesa la creación de una nueva institución vinculándola al usuario actual.
 * POR QUÉ: Realiza la extracción del `accountId` desde el token JWT antes de parsear el body. Esto garantiza que la autoría sea inyectada por el servidor y no pueda ser suplantada por el cliente en el cuerpo de la petición.
 * @param req {HttpRequest} Incluye el objeto `institution` y metadatos del `file` (logo).
 * @param res {HttpResponse} Respuesta 201 en caso de éxito.
 * @return {Promise<void>}
 * @throws {Ninguna} Errores de validación o permisos gestionados por el servicio.
 */
async function createInstitucionAction(req, res) {
    try {
        const payload = (0, auth_1.tryGetAuthPayload)(req);
        const accountId = Number(payload?.sub);
        const body = await (0, body_1.readJsonBody)(req);
        const inst = await (0, instituciones_service_1.addInstitution)(body.institution, body.file, accountId);
        (0, json_1.sendJson)(res, 201, { ok: true, message: "Institución creada", institucion: inst });
    }
    catch (error) {
        (0, json_1.sendJson)(res, (0, auth_routes_1.getErrorStatus)(error), { ok: false, message: (0, auth_routes_1.getErrorMessage)(error) });
    }
}
/**
 * Descripción: Actualiza los datos de una institución existente identificada por su ID.
 * POR QUÉ: Implementa una validación previa del ID (`isNaN`) para evitar llamadas costosas al servicio si el parámetro de ruta es inválido. Soporta la actualización parcial donde el logo (`file`) puede ser omitido si el administrador solo desea corregir metadatos de texto.
 * @param req {HttpRequest} Contiene el ID en params y los nuevos datos en el body.
 * @param res {HttpResponse} Respuesta 200 con la institución actualizada.
 * @return {Promise<void>}
 * @throws {400} Si el ID proporcionado no es un número válido.
 */
async function updateInstitucionAction(req, res) {
    try {
        const id = Number(req.params?.id);
        if (!id || isNaN(id))
            return (0, json_1.sendJson)(res, 400, { ok: false, message: "ID inválido" });
        const payload = (0, auth_1.tryGetAuthPayload)(req);
        const accountId = Number(payload?.sub);
        const body = await (0, body_1.readJsonBody)(req);
        const inst = await (0, instituciones_service_1.editInstitution)(id, body.institution, body.file, accountId);
        (0, json_1.sendJson)(res, 200, { ok: true, message: "Institución actualizada correctamente", institucion: inst });
    }
    catch (error) {
        (0, json_1.sendJson)(res, (0, auth_routes_1.getErrorStatus)(error), { ok: false, message: (0, auth_routes_1.getErrorMessage)(error) });
    }
}
/**
 * Descripción: Elimina una institución del sistema de forma definitiva.
 * POR QUÉ: Sigue el patrón RESTful al extraer el ID del recurso directamente desde la ruta de la petición. Delega la lógica de integridad referencial (como qué sucede con los logos huérfanos) totalmente a la capa de servicio.
 * @param req {HttpRequest} Requiere el ID del recurso en los parámetros de ruta.
 * @param res {HttpResponse} Respuesta de confirmación.
 * @return {Promise<void>}
 * @throws {400} Si el ID es inválido.
 * @throws {404} Si la institución no existe (vía servicio).
 */
async function deleteInstitucionAction(req, res) {
    try {
        const id = Number(req.params?.id);
        if (!id || isNaN(id))
            return (0, json_1.sendJson)(res, 400, { ok: false, message: "ID inválido" });
        const result = await (0, instituciones_service_1.removeInstitution)(id);
        (0, json_1.sendJson)(res, 200, { ok: true, message: result.message });
    }
    catch (error) {
        (0, json_1.sendJson)(res, (0, auth_routes_1.getErrorStatus)(error), { ok: false, message: (0, auth_routes_1.getErrorMessage)(error) });
    }
}
/**
 * Descripción: Provee una lista de instituciones filtrada por visibilidad pública, con soporte para búsqueda y paginación.
 * POR QUÉ: Es el único controlador que parsea manualmente la Query String (`URLSearchParams`). Se separa de la ruta administrativa para aplicar reglas de compensación (offset) y límites que optimizan el rendimiento del frontend, devolviendo metadatos de paginación (`totalPages`) necesarios para renderizar los controles de navegación de la lista pública.
 * @param req {HttpRequest} Soporta query params: `search`, `page`, `limit`.
 * @param res {HttpResponse} Respuesta 200 con datos paginados.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
async function getPublicInstitucionesAction(req, res) {
    try {
        const url = new URL(req.url || "", `http://${req.headers?.host || "localhost"}`);
        const search = url.searchParams.get("search") || "";
        const page = parseInt(url.searchParams.get("page") || "1", 10);
        const limit = parseInt(url.searchParams.get("limit") || "9", 10);
        const result = await (0, instituciones_service_1.getPublicInstitutions)(search, page, limit);
        (0, json_1.sendJson)(res, 200, {
            ok: true,
            total: result.total,
            totalPages: result.totalPages,
            data: result.data
        });
    }
    catch (error) {
        console.error("❌ Error en getAllCategoriesAction:", error); // AGREGAR ESTO
        (0, json_1.sendJson)(res, (0, auth_routes_1.getErrorStatus)(error), { ok: false, message: (0, auth_routes_1.getErrorMessage)(error) });
    }
}
