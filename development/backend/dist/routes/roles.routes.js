"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRolesDetailsAction = getRolesDetailsAction;
exports.getPermisosAction = getPermisosAction;
exports.createRoleAction = createRoleAction;
exports.updateRoleAction = updateRoleAction;
exports.deleteRoleAction = deleteRoleAction;
const json_1 = require("../utils/json");
const body_1 = require("../utils/body");
const auth_routes_1 = require("./auth.routes");
const roles_service_1 = require("../services/roles.service");
/**
 * Descripción: Recupera el catálogo de roles enriquecido con conteos de usuarios y listas de permisos.
 * POR QUÉ: No devuelve una lista simple, sino una vista analítica pesada. Esto se diseñó específicamente para poblar la tabla principal del panel de administración ("Data Grid"), permitiendo al cliente mostrar toda la matriz de seguridad sin tener que hacer peticiones adicionales.
 * * FLUJO:
 * 1. Invoca al servicio `getRolesDetails`.
 * 2. Empaqueta y retorna la colección en un JSON estandarizado.
 * * @openapi
 * /api/roles/detalles:
 * get:
 * summary: Listar roles con detalles analíticos
 * description: Devuelve todos los roles del sistema incluyendo cuántos usuarios lo poseen y qué matriz de permisos exacta tienen asignada.
 * tags:
 * - RBAC (Roles y Permisos)
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Matriz de roles recuperada exitosamente.
 * 401:
 * description: Sesión inválida o expirada.
 * 403:
 * description: Permisos insuficientes para administrar RBAC.
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna} Errores manejados internamente y emitidos como JSON.
 */
async function getRolesDetailsAction(req, res) {
    try {
        const roles = await (0, roles_service_1.getRolesDetails)();
        (0, json_1.sendJson)(res, 200, { ok: true, roles });
    }
    catch (error) {
        (0, json_1.sendJson)(res, (0, auth_routes_1.getErrorStatus)(error), { ok: false, message: (0, auth_routes_1.getErrorMessage)(error) });
    }
}
/**
 * Descripción: Recupera el diccionario maestro de permisos del sistema.
 * POR QUÉ: Este endpoint es vital para la construcción dinámica de interfaces. El frontend consume esta lista para renderizar de forma automática todos los checkboxes agrupados por módulo al momento de crear o editar un rol, asegurando que la UI nunca esté desincronizada con la Base de Datos.
 * * FLUJO:
 * 1. Invoca al servicio `getAllPermissions`.
 * 2. Retorna los datos crudos estandarizados.
 * * @openapi
 * /api/permisos:
 * get:
 * summary: Listar diccionario de permisos
 * description: Obtiene todos los permisos activos disponibles para ser asignados a un rol.
 * tags:
 * - RBAC (Roles y Permisos)
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Lista de permisos recuperada exitosamente.
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
async function getPermisosAction(req, res) {
    try {
        const permisos = await (0, roles_service_1.getAllPermissions)();
        (0, json_1.sendJson)(res, 200, { ok: true, permisos });
    }
    catch (error) {
        (0, json_1.sendJson)(res, (0, auth_routes_1.getErrorStatus)(error), { ok: false, message: (0, auth_routes_1.getErrorMessage)(error) });
    }
}
/**
 * Descripción: Registra un nuevo rol de sistema y le asigna su matriz de permisos inicial de forma atómica.
 * POR QUÉ: Exige el array `permisos` desde la petición original. Esto refuerza el diseño de creación atómica: un rol no puede nacer "vacío" o en un estado de limbo de accesos, debe proveerse su configuración de seguridad completa desde el primer instante. Devuelve un estado HTTP 201 explícito.
 * * FLUJO:
 * 1. Extrae y tipa el payload JSON desde el body.
 * 2. Pasa los datos (incluyendo el array numérico de permisos) al servicio.
 * 3. Retorna un HTTP 201 confirmando la creación.
 * * @openapi
 * /api/roles:
 * post:
 * summary: Crear un nuevo rol
 * description: Genera un nuevo nivel de acceso en el sistema y le vincula los permisos seleccionados.
 * tags:
 * - RBAC (Roles y Permisos)
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - code
 * - name
 * - description
 * - permisos
 * properties:
 * code:
 * type: string
 * example: "editor_contenido"
 * name:
 * type: string
 * example: "Editor de Contenido"
 * description:
 * type: string
 * example: "Puede crear y editar datasets pero no borrarlos."
 * permisos:
 * type: array
 * items:
 * type: integer
 * example: [1, 2, 5, 8]
 * responses:
 * 201:
 * description: Rol creado exitosamente y permisos vinculados.
 * 400:
 * description: Payload inválido o permisos ausentes.
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
async function createRoleAction(req, res) {
    try {
        const body = await (0, body_1.readJsonBody)(req);
        const result = await (0, roles_service_1.createNewRole)(body.code, body.name, body.description, body.permisos);
        (0, json_1.sendJson)(res, 201, { ok: true, message: result.message, roleId: result.roleId });
    }
    catch (error) {
        (0, json_1.sendJson)(res, (0, auth_routes_1.getErrorStatus)(error), { ok: false, message: (0, auth_routes_1.getErrorMessage)(error) });
    }
}
/**
 * Descripción: Actualiza los metadatos de un rol y reemplaza íntegramente sus permisos asociados.
 * POR QUÉ: Utiliza el verbo HTTP PUT porque la operación exige el payload completo y actúa como un reemplazo absoluto (Wipe and Replace), sobrescribiendo tanto los datos básicos como la matriz de permisos anterior, asegurando idempotencia en la llamada.
 * * FLUJO:
 * 1. Extrae, castea a número y valida el ID de la ruta.
 * 2. Lee el payload estructurado del body.
 * 3. Delega la transacción de actualización al servicio.
 * * @openapi
 * /api/roles/{id}:
 * put:
 * summary: Editar un rol existente
 * description: Sobrescribe los datos de un rol y reemplaza todos sus permisos con la nueva matriz enviada.
 * tags:
 * - RBAC (Roles y Permisos)
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * description: ID numérico del rol a modificar.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * code:
 * type: string
 * name:
 * type: string
 * description:
 * type: string
 * permisos:
 * type: array
 * items:
 * type: integer
 * responses:
 * 200:
 * description: Rol actualizado de forma atómica.
 * 400:
 * description: Petición mal formada o ID inválido.
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
async function updateRoleAction(req, res) {
    try {
        const id = Number(req.params?.id);
        if (!id || isNaN(id))
            return (0, json_1.sendJson)(res, 400, { ok: false, message: "ID de rol inválido o requerido" });
        const body = await (0, body_1.readJsonBody)(req);
        const result = await (0, roles_service_1.updateExistingRole)(id, body.code, body.name, body.description, body.permisos);
        (0, json_1.sendJson)(res, 200, { ok: true, message: result.message });
    }
    catch (error) {
        (0, json_1.sendJson)(res, (0, auth_routes_1.getErrorStatus)(error), { ok: false, message: (0, auth_routes_1.getErrorMessage)(error) });
    }
}
/**
 * Descripción: Elimina un rol del sistema delegando la mitigación de los usuarios afectados.
 * POR QUÉ: El controlador se limita a validar que el ID sea numéricamente válido y transfiere el flujo. Mantiene total ignorancia sobre las reglas de negocio críticas (como proteger al 'super_admin' o el 'registered_user'), cumpliendo con el principio de responsabilidad única.
 * * FLUJO:
 * 1. Extrae y convierte el ID de los parámetros de ruta.
 * 2. Falla rápidamente con 400 si el ID es `NaN`.
 * 3. Solicita al servicio la eliminación.
 * * @openapi
 * /api/roles/{id}:
 * delete:
 * summary: Eliminar un rol
 * description: Ejecuta un borrado del rol y reasigna automáticamente a los usuarios afectados al rol base del sistema.
 * tags:
 * - RBAC (Roles y Permisos)
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * description: ID del rol a destruir.
 * responses:
 * 200:
 * description: Rol eliminado y cuentas reasignadas de forma segura.
 * 400:
 * description: Parámetro ID inválido.
 * 403:
 * description: Prohibición explícita de borrar roles base del sistema (ej. super_admin).
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
async function deleteRoleAction(req, res) {
    try {
        const id = Number(req.params?.id);
        if (!id || isNaN(id))
            return (0, json_1.sendJson)(res, 400, { ok: false, message: "ID de rol inválido o requerido" });
        const result = await (0, roles_service_1.removeRole)(id);
        (0, json_1.sendJson)(res, 200, { ok: true, message: result.message });
    }
    catch (error) {
        (0, json_1.sendJson)(res, (0, auth_routes_1.getErrorStatus)(error), { ok: false, message: (0, auth_routes_1.getErrorMessage)(error) });
    }
}
