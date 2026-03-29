<<<<<<< HEAD
/**
 * ============================================================================
 * MÓDULO: Enrutador de Roles y Permisos (roles.routes.ts)
 * * PROPÓSITO: Exponer los endpoints de la API REST para la administración 
 * del modelo de Control de Acceso Basado en Roles (RBAC).
 * * RESPONSABILIDAD: Actuar como la capa de transporte para las operaciones 
 * CRUD de roles, extrayendo parámetros de las rutas y el body, y estandarizando 
 * las respuestas JSON hacia el frontend.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Workaround de Tipado y Validación: Dado el enrutador personalizado, los IDs 
 * de la URL se extraen dinámicamente (`(req as any).params?.id`). En los métodos 
 * PUT y DELETE, se fuerza la conversión a `Number` y se implementa una guardia 
 * `isNaN(id)` para aplicar un patrón de "Fallo Rápido". Esto evita enviar 
 * peticiones inútiles a la base de datos si el frontend envía un parámetro 
 * mal formado.
 * ============================================================================
 */
import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson } from "../utils/json";
import { readJsonBody } from "../utils/body";
=======
import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson } from "../utils/json";
import { readJsonBody } from "../utils/body";
// Reutilizamos tus funciones de error ya existentes en auth.routes
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
import { getErrorStatus, getErrorMessage } from "./auth.routes"; 
import {
  getRolesDetails,
  getAllPermissions,
  createNewRole,
  updateExistingRole,
  removeRole
} from "../services/roles.service";

<<<<<<< HEAD
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
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function getRolesDetailsAction(req: HttpRequest, res: HttpResponse) {
  try {
    const roles = await getRolesDetails();
    sendJson(res, 200, { ok: true, roles });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

<<<<<<< HEAD
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
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function getPermisosAction(req: HttpRequest, res: HttpResponse) {
  try {
    const permisos = await getAllPermissions();
    sendJson(res, 200, { ok: true, permisos });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

<<<<<<< HEAD
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
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function createRoleAction(req: HttpRequest, res: HttpResponse) {
  try {
    const body = await readJsonBody<{ code: string, name: string, description: string, permisos: number[] }>(req);
    const result = await createNewRole(body.code, body.name, body.description, body.permisos);
    sendJson(res, 201, { ok: true, message: result.message, roleId: result.roleId });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

<<<<<<< HEAD
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
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function updateRoleAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID de rol inválido o requerido" });

    const body = await readJsonBody<{ code: string, name: string, description: string, permisos: number[] }>(req);
    const result = await updateExistingRole(id, body.code, body.name, body.description, body.permisos);
    sendJson(res, 200, { ok: true, message: result.message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

<<<<<<< HEAD
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
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function deleteRoleAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID de rol inválido o requerido" });

    const result = await removeRole(id);
    sendJson(res, 200, { ok: true, message: result.message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}