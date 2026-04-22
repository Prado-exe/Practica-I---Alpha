"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsuariosAction = getUsuariosAction;
exports.toggleEstadoAction = toggleEstadoAction;
exports.deleteUsuarioAction = deleteUsuarioAction;
exports.editUsuarioAction = editUsuarioAction;
exports.getRolesAction = getRolesAction;
const body_1 = require("../utils/body");
const json_1 = require("../utils/json");
const auth_routes_1 = require("./auth.routes");
const auth_service_1 = require("../services/auth.service");
/**
 * Descripción: Recupera el catálogo maestro de todos los usuarios registrados.
 * POR QUÉ: Actualmente se sirve la lista completa asumiendo un volumen manejable de usuarios en el sistema para la tabla de administración. Si la base de datos escala masivamente, este endpoint deberá ser refactorizado para aceptar parámetros de query (`?page=1&limit=50`) y delegarlos al servicio.
 * * FLUJO:
 * 1. Invoca al servicio para obtener la matriz de usuarios procesada.
 * 2. Devuelve un HTTP 200 con la colección de datos.
 * * @openapi
 * /api/usuarios:
 * get:
 * summary: Listar todos los usuarios
 * description: Obtiene la lista completa de cuentas de usuario, incluyendo su estado y rol actual. Uso exclusivo de administradores.
 * tags:
 * - Gestión de Usuarios
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Lista de usuarios recuperada exitosamente.
 * 401:
 * description: Petición rechazada por falta de token.
 * 403:
 * description: El usuario no tiene permisos suficientes para leer este catálogo.
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna} Errores atrapados y enviados como JSON.
 */
async function getUsuariosAction(req, res) {
    try {
        const usuarios = await (0, auth_service_1.getAllUsers)();
        (0, json_1.sendJson)(res, 200, { ok: true, usuarios });
    }
    catch (error) {
        (0, json_1.sendJson)(res, (0, auth_routes_1.getErrorStatus)(error), { ok: false, message: (0, auth_routes_1.getErrorMessage)(error) });
    }
}
/**
 * Descripción: Modifica el estado operativo de una cuenta de usuario específica (ej. de 'active' a 'suspended').
 * POR QUÉ: Se utiliza el método HTTP `PATCH` en lugar de `PUT` porque esta operación representa una mutación parcial (solo el campo estado) del recurso usuario, respetando los estándares RESTful.
 * * FLUJO:
 * 1. Extrae el ID del parámetro dinámico de la URL mediante aserción de tipos.
 * 2. Verifica tempranamente que el ID exista, abortando con 400 si falta.
 * 3. Lee el nuevo estado del cuerpo de la petición.
 * 4. Delega la validación de negocio y actualización al servicio.
 * * @openapi
 * /api/usuarios/{id}/estado:
 * patch:
 * summary: Cambiar estado de un usuario
 * description: Actualiza el estado (ej. active, suspended) de una cuenta en particular.
 * tags:
 * - Gestión de Usuarios
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * description: ID numérico de la cuenta del usuario.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - estado
 * properties:
 * estado:
 * type: string
 * enum: [active, suspended, pending_verification, pending_revalidation]
 * example: "suspended"
 * responses:
 * 200:
 * description: Estado actualizado correctamente.
 * 400:
 * description: ID faltante o estado no válido.
 * 404:
 * description: Usuario no encontrado.
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
async function toggleEstadoAction(req, res) {
    try {
        const id = req.params?.id;
        if (!id) {
            (0, json_1.sendJson)(res, 400, { ok: false, message: "ID de usuario requerido" });
            return;
        }
        const body = await (0, body_1.readJsonBody)(req);
        const result = await (0, auth_service_1.updateUserStatus)(id, body.estado);
        (0, json_1.sendJson)(res, 200, { ok: true, message: result.message });
    }
    catch (error) {
        (0, json_1.sendJson)(res, (0, auth_routes_1.getErrorStatus)(error), { ok: false, message: (0, auth_routes_1.getErrorMessage)(error) });
    }
}
/**
 * Descripción: Elimina definitivamente una cuenta de usuario del sistema.
 * POR QUÉ: El controlador asume un rol puramente orquestador. Las reglas vitales de seguridad (como impedir que un administrador borre al "super_admin") no se programan aquí, sino que se delegan 100% al servicio (`deleteUser`) para mantener el controlador "tonto" y agnóstico a la lógica de negocio profunda.
 * * FLUJO:
 * 1. Extrae y valida la presencia del ID en la ruta.
 * 2. Ejecuta la operación de borrado en la capa de servicios.
 * * @openapi
 * /api/usuarios/{id}:
 * delete:
 * summary: Eliminar un usuario
 * description: Realiza un borrado físico de la cuenta del usuario. Implementa salvaguardas para proteger cuentas críticas del sistema.
 * tags:
 * - Gestión de Usuarios
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * description: ID numérico del usuario a eliminar.
 * responses:
 * 200:
 * description: Usuario eliminado correctamente.
 * 400:
 * description: Petición mal formada (ID faltante).
 * 403:
 * description: Acción prohibida (ej. intento de borrar a un super_admin).
 * 404:
 * description: El usuario no existe.
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
async function deleteUsuarioAction(req, res) {
    try {
        const id = req.params?.id;
        if (!id) {
            (0, json_1.sendJson)(res, 400, { ok: false, message: "ID de usuario requerido" });
            return;
        }
        const result = await (0, auth_service_1.deleteUser)(id);
        (0, json_1.sendJson)(res, 200, { ok: true, message: result.message });
    }
    catch (error) {
        (0, json_1.sendJson)(res, (0, auth_routes_1.getErrorStatus)(error), { ok: false, message: (0, auth_routes_1.getErrorMessage)(error) });
    }
}
/**
 * Descripción: Modifica el perfil de un usuario, alterando sus datos personales, nivel de acceso y credenciales si es necesario.
 * POR QUÉ: Se exige explícitamente el campo `role_code` en esta capa. Una cuenta que pierde su asociación de rol corrompe todo el modelo RBAC del sistema, por lo que el controlador aborta la petición (Fallo rápido/Fail-fast) antes de contactar a la base de datos si este dato se omitió en el JSON.
 * * FLUJO:
 * 1. Extrae el ID de la URL y valida su existencia.
 * 2. Lee el payload estructurado del body (nombre, correo, rol y clave opcional).
 * 3. Valida la presencia obligatoria del `role_code`.
 * 4. Pasa los datos al servicio administrativo de actualización.
 * * @openapi
 * /api/usuarios/{id}:
 * put:
 * summary: Editar perfil de un usuario
 * description: Modifica los datos básicos y el rol de un usuario. Permite de forma opcional forzar el cambio de la contraseña.
 * tags:
 * - Gestión de Usuarios
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * description: ID de la cuenta a modificar.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - full_name
 * - email
 * - role_code
 * properties:
 * full_name:
 * type: string
 * example: "Carlos Administrador"
 * email:
 * type: string
 * format: email
 * example: "carlos@institucion.com"
 * role_code:
 * type: string
 * example: "admin"
 * password:
 * type: string
 * description: Opcional. Nueva contraseña para el usuario.
 * example: "NuevaClave123!"
 * responses:
 * 200:
 * description: Usuario actualizado exitosamente.
 * 400:
 * description: Faltan parámetros críticos como el ID o el código de rol.
 * 404:
 * description: El usuario o el rol especificado no existe.
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
async function editUsuarioAction(req, res) {
    try {
        const id = req.params?.id;
        if (!id) {
            (0, json_1.sendJson)(res, 400, { ok: false, message: "ID de usuario requerido" });
            return;
        }
        const body = await (0, body_1.readJsonBody)(req);
        if (!body.role_code) {
            (0, json_1.sendJson)(res, 400, { ok: false, message: "El rol es obligatorio" });
            return;
        }
        const result = await (0, auth_service_1.editUserAdmin)(id, body.full_name, body.email, body.role_code, body.password);
        (0, json_1.sendJson)(res, 200, { ok: true, message: result.message });
    }
    catch (error) {
        (0, json_1.sendJson)(res, (0, auth_routes_1.getErrorStatus)(error), { ok: false, message: (0, auth_routes_1.getErrorMessage)(error) });
    }
}
/**
 * Descripción: Recupera el listado base de roles activos que pueden ser asignados a un usuario.
 * POR QUÉ: Se aísla este método en lugar de utilizar la función pesada `getRolesDetails` del módulo de roles. Dado que este endpoint está pensado para poblar un simple combo box (dropdown select) en el formulario de "Editar Usuario", solo requiere la tupla básica de ID y Nombre de los roles activos, optimizando la latencia y el tamaño del payload HTTP.
 * * FLUJO:
 * 1. Llama al servicio para obtener roles activos.
 * 2. Devuelve los datos en formato JSON estandarizado.
 * * @openapi
 * /api/roles:
 * get:
 * summary: Listar roles activos para asignación
 * description: Devuelve una lista ligera de roles diseñada para llenar selectores en formularios de administración de cuentas.
 * tags:
 * - Gestión de Usuarios
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Lista de roles activos recuperada exitosamente.
 * 401:
 * description: Petición rechazada por falta de permisos.
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
async function getRolesAction(req, res) {
    try {
        const roles = await (0, auth_service_1.getActiveRoles)();
        (0, json_1.sendJson)(res, 200, { ok: true, roles });
    }
    catch (error) {
        (0, json_1.sendJson)(res, (0, auth_routes_1.getErrorStatus)(error), { ok: false, message: (0, auth_routes_1.getErrorMessage)(error) });
    }
}
