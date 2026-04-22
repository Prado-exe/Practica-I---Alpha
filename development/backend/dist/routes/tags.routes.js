"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTagsAction = getAllTagsAction;
/**
 * ============================================================================
 * MÓDULO: Enrutador de Etiquetas (tags.routes.ts)
 * * PROPÓSITO: Exponer mediante una API REST el catálogo de etiquetas (tags)
 * o palabras clave del sistema.
 * * RESPONSABILIDAD: Actuar como punto de entrada HTTP para la obtención de
 * etiquetas, delegando la extracción de datos al servicio correspondiente y
 * estandarizando la respuesta JSON.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Acceso Público: Según la configuración en el enrutador principal
 * (`authRouter.add("GET", "/api/tags", [], ...)`), este endpoint no requiere
 * autenticación (`requireLogin` o `requirePermission`). Se asume que el
 * vocabulario de etiquetas es información de dominio público, útil tanto para
 * formularios internos como para filtros de búsqueda en la web pública.
 * ============================================================================
 */
const tags_service_1 = require("../services/tags.service");
const json_1 = require("../utils/json");
const auth_routes_1 = require("./auth.routes");
/**
 * Descripción: Controlador que procesa peticiones HTTP GET para listar todas las etiquetas registradas en el sistema.
 * POR QUÉ: Sirve la colección entera sin mecanismos de paginación. Esto es intencional, ya que el objetivo principal de este endpoint es alimentar componentes de interfaz de usuario como "Typeaheads", "Comboboxes" o campos "Multi-Select" en el frontend, los cuales necesitan tener el diccionario de datos completo en memoria para funcionar sin latencia al escribir.
 * * FLUJO:
 * 1. Invoca al servicio `getTagsForDropdown` para obtener los datos de la BD.
 * 2. Empaqueta el resultado en un JSON estandarizado (`{ ok: true, data: [...] }`).
 * 3. Si ocurre una excepción, la atrapa y delega la resolución del código HTTP al helper `getErrorStatus`.
 * * @openapi
 * /api/tags:
 * get:
 * summary: Listar todas las etiquetas
 * description: Devuelve el listado completo de palabras clave (tags) disponibles en el sistema para clasificación o búsqueda.
 * tags:
 * - Catálogos Maestros
 * responses:
 * 200:
 * description: Lista de etiquetas recuperada exitosamente.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * ok:
 * type: boolean
 * example: true
 * data:
 * type: array
 * items:
 * type: object
 * properties:
 * tag_id:
 * type: integer
 * example: 1
 * name:
 * type: string
 * example: "Economía"
 * 500:
 * description: Error interno del servidor o pérdida de conectividad con la base de datos.
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna} Los errores se envuelven y devuelven como respuestas HTTP.
 */
async function getAllTagsAction(req, res) {
    try {
        const data = await (0, tags_service_1.getTagsForDropdown)();
        (0, json_1.sendJson)(res, 200, { ok: true, data });
    }
    catch (error) {
        (0, json_1.sendJson)(res, (0, auth_routes_1.getErrorStatus)(error), { ok: false, message: (0, auth_routes_1.getErrorMessage)(error) });
    }
}
