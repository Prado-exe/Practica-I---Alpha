"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRolesDetails = getRolesDetails;
exports.getAllPermissions = getAllPermissions;
exports.createNewRole = createNewRole;
exports.updateExistingRole = updateExistingRole;
exports.removeRole = removeRole;
/**
 * ============================================================================
 * MÓDULO: Servicio de Roles y Permisos (roles.service.ts)
 * * PROPÓSITO: Centralizar la lógica de negocio para la gestión de la
 * Autorización Basada en Roles (RBAC).
 * * RESPONSABILIDAD: Actuar como orquestador entre las peticiones HTTP y la base
 * de datos, garantizando que las operaciones de creación, actualización y
 * borrado mantengan la integridad del sistema de accesos.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Atomicidad en Permisos: Se asume que la asignación/edición de permisos se
 * maneja como una operación de "reemplazo total" (wipe and replace) en lugar
 * de calcular diferencias (diffs). Por eso se exige siempre el array completo.
 * - Borrado Seguro (Safe Delete): La eliminación de un rol no elimina en
 * cascada a los usuarios ni los deja huérfanos; se asume una estrategia de
 * degradación segura (fallback) reasignándolos a un rol base.
 * ============================================================================
 */
const roles_repository_1 = require("../repositories/roles.repository");
const app_error_1 = require("../types/app-error");
/**
 * Descripción: Recupera el listado completo de roles junto con el desglose de todos los permisos que cada uno posee.
 * POR QUÉ: A diferencia de un simple catálogo, esta función construye una vista pesada y detallada diseñada específicamente para el panel de administración, permitiendo a los administradores auditar visualmente qué acciones puede realizar cada rol del sistema sin hacer múltiples peticiones.
 * @param {void} No requiere parámetros de entrada.
 * @return {Promise<Array>} Lista de roles estructurada con sus respectivos arrays de permisos.
 * @throws {Ninguna}
 */
async function getRolesDetails() {
    return await (0, roles_repository_1.getRolesWithDetailsFromDb)();
}
/**
 * Descripción: Recupera el catálogo maestro de permisos disponibles en el sistema.
 * POR QUÉ: Provee la materia prima necesaria para que el frontend pueda construir dinámicamente la interfaz de creación y edición de roles (ej. renderizar los checkboxes organizados por módulos).
 * @param {void} No requiere parámetros de entrada.
 * @return {Promise<Array>} Lista de todos los permisos registrados en la BD.
 * @throws {Ninguna}
 */
async function getAllPermissions() {
    return await (0, roles_repository_1.getAllPermissionsFromDb)();
}
/**
 * Descripción: Valida y registra un nuevo rol de sistema asignándole su conjunto de permisos inicial.
 * POR QUÉ: Implementa una validación estricta de "Fallo Rápido" (Fail-Fast). Un rol sin permisos o sin código identificador es inútil y potencialmente peligroso en el modelo RBAC, por lo que la función aborta y rechaza la petición en memoria antes de siquiera intentar interactuar con la base de datos.
 * @param code {string} Identificador interno único del rol (ej. 'admin', 'editor').
 * @param name {string} Nombre legible para la interfaz de usuario.
 * @param description {string} Detalle del propósito del rol.
 * @param permisos {number[]} Array con los IDs numéricos de los permisos a conceder.
 * @return {Promise<Object>} Mensaje de éxito y el ID del rol recién creado.
 * @throws {AppError} 400 Si los campos están vacíos o el array de permisos no tiene elementos.
 */
async function createNewRole(code, name, description, permisos) {
    if (!code || !name || !permisos || permisos.length === 0) {
        throw new app_error_1.AppError("Faltan campos obligatorios o permisos", 400);
    }
    const roleId = await (0, roles_repository_1.createRoleWithPermissionsInDb)(code, name, description, permisos);
    return { message: "Rol creado exitosamente", roleId };
}
/**
 * Descripción: Modifica los metadatos de un rol existente y reemplaza la totalidad de sus permisos asociados.
 * POR QUÉ: Reutiliza la misma barrera de validación estricta de la creación. Al exigir siempre un array `permisos` no vacío, previene que un administrador bloquee accidentalmente un rol dejándolo con cero accesos por un error en la interfaz de usuario.
 * @param roleId {number} ID único del rol a actualizar.
 * @param code {string} Identificador interno actualizado.
 * @param name {string} Nombre legible actualizado.
 * @param description {string} Descripción actualizada.
 * @param permisos {number[]} Array completo con los IDs de los permisos que deberá tener ahora.
 * @return {Promise<Object>} Mensaje de confirmación.
 * @throws {AppError} 400 Si faltan datos críticos o se envían permisos vacíos.
 */
async function updateExistingRole(roleId, code, name, description, permisos) {
    if (!code || !name || !permisos || permisos.length === 0) {
        throw new app_error_1.AppError("Faltan campos obligatorios o permisos", 400);
    }
    await (0, roles_repository_1.updateRoleWithPermissionsInDb)(roleId, code, name, description, permisos);
    return { message: "Rol actualizado exitosamente" };
}
/**
 * Descripción: Elimina un rol del sistema y ejecuta la política de mitigación para los usuarios afectados.
 * POR QUÉ: Intercepta y traduce los errores provenientes del repositorio de datos. Si se intenta borrar un rol protegido (como el 'super_admin') o la reasignación de usuarios falla, el `catch` captura el error nativo y lo empaqueta en un `AppError` con código HTTP 403 (Prohibido) para que el controlador lo entienda y se lo muestre limpio al cliente.
 * @param roleId {number} ID del rol a eliminar.
 * @return {Promise<Object>} Mensaje confirmando la eliminación y el traspaso de usuarios.
 * @throws {AppError} 403 Si la operación de borrado o reasignación es denegada por reglas de integridad.
 */
async function removeRole(roleId) {
    try {
        await (0, roles_repository_1.deleteRoleAndReassignUsersInDb)(roleId);
        return { message: "Rol eliminado. Usuarios reasignados al rol base." };
    }
    catch (error) {
        throw new app_error_1.AppError(error.message || "Error al eliminar el rol", 403);
    }
}
