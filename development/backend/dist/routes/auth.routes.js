"use strict";
/**
 * ============================================================================
 * MÓDULO: Enrutador Principal de Autenticación y Gestión (auth.routes.ts)
 * * PROPÓSITO: Centralizar la definición de rutas de la API, vinculando
 * métodos HTTP y rutas con sus respectivos controladores y middlewares de seguridad.
 * * RESPONSABILIDAD: Actuar como el "Mapa de Tráfico" del sistema, gestionando
 * la inyección de seguridad (RBAC) y proveyendo utilidades globales para el
 * manejo de errores y sesiones.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Centralización de Errores: Se implementan funciones de ayuda (`getErrorStatus`,
 * `getErrorMessage`) para que todos los controladores del sistema respondan
 * con un contrato de error idéntico, facilitando la integración del frontend.
 * - Seguridad por Capas: Se asume el uso de un enrutador personalizado que
 * procesa middlewares en cadena. La seguridad se aplica mediante `requirePermission`,
 * permitiendo una auditoría visual rápida de quién tiene acceso a qué recurso.
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
exports.getSessionIdFromRequest = getSessionIdFromRequest;
exports.getErrorStatus = getErrorStatus;
exports.getErrorMessage = getErrorMessage;
const router_1 = require("../utils/router");
const auth_1 = require("../utils/auth");
const request_cookies_1 = require("../utils/request-cookies");
const jwt_1 = require("../utils/jwt");
const app_error_1 = require("../types/app-error");
const zod_1 = require("zod");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const login_routes_1 = require("./login.routes");
const logout_routes_1 = require("./logout.routes");
const register_routes_1 = require("./register.routes");
const verify_routes_1 = require("./verify.routes");
const refresh_routes_1 = require("./refresh.routes");
const password_routes_1 = require("./password.routes");
const usuarios_admin_routes_1 = require("./usuarios-admin.routes");
const upload_routes_1 = require("./upload.routes");
const roles_routes_1 = require("./roles.routes");
const instituciones_routes_1 = require("./instituciones.routes");
const categories_routes_1 = require("./categories.routes");
const datasets_routes_1 = require("./datasets.routes");
const tags_routes_1 = require("./tags.routes");
const licenses_routes_1 = require("./licenses.routes");
/**
 * Descripción: Extrae el identificador de la sesión activa desde el Access Token o el Refresh Token.
 * POR QUÉ: Implementa una lógica de extracción de doble fuente. Primero intenta obtener el ID del payload del Access Token (transatómico/rápido). Si falla, recurre al Refresh Token en las cookies para asegurar la trazabilidad de la sesión incluso en flujos de renovación o cierre de sesión donde el token de acceso puede haber expirado o ser inexistente.
 * @param req {HttpRequest} Objeto de la petición con cabeceras y cookies.
 * @return {number | string | null} El ID de la sesión encontrada o null si no hay rastro de identidad.
 * @throws {Ninguna} Los errores de verificación de JWT se capturan internamente para retornar null de forma segura.
 */
function getSessionIdFromRequest(req) {
    const accessPayload = (0, auth_1.tryGetAuthPayload)(req);
    if (accessPayload?.sessionId)
        return accessPayload.sessionId;
    const cookies = (0, request_cookies_1.parseCookies)(req);
    const refreshToken = cookies.refreshToken;
    if (!refreshToken)
        return null;
    try {
        const refreshPayload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        return refreshPayload.sessionId;
    }
    catch {
        return null;
    }
}
/**
 * Descripción: Determina el código de estado HTTP adecuado según la naturaleza del error capturado.
 * POR QUÉ: Desacopla la lógica de negocio del protocolo de transporte. Clasifica errores conocidos de la aplicación (`AppError`) con sus estados específicos y traduce automáticamente fallos de validación estructural (`ZodError`) a un HTTP 400 (Bad Request), protegiendo el sistema al devolver un 500 genérico ante excepciones desconocidas.
 * @param error {unknown} El objeto de error capturado en el bloque catch.
 * @return {number} Código de estado HTTP (200, 400, 403, 404, 500, etc.).
 * @throws {Ninguna}
 */
function getErrorStatus(error) {
    if (error instanceof app_error_1.AppError)
        return error.statusCode;
    if (error instanceof zod_1.ZodError)
        return 400;
    return 500;
}
/**
 * Descripción: Extrae o genera un mensaje de error seguro para ser enviado al cliente.
 * POR QUÉ: Estandariza la respuesta de error. En el caso de `ZodError`, devuelve el array completo de `issues` para permitir al frontend realizar validaciones de campo en tiempo real. Para errores no controlados, anonimiza el mensaje para evitar la filtración de información sensible de la infraestructura (stack traces, nombres de tablas, etc.).
 * @param error {unknown} Objeto de error capturado.
 * @return {any} String con el mensaje o array de objetos con detalles de validación.
 * @throws {Ninguna}
 */
function getErrorMessage(error) {
    if (error instanceof app_error_1.AppError)
        return error.message;
    if (error instanceof zod_1.ZodError)
        return error.issues;
    return "Error interno del servidor";
}
/**
 * Descripción: Instancia configurada del enrutador que mapea la superficie de ataque y los recursos de la API.
 * POR QUÉ: Centraliza la política de Control de Acceso Basado en Roles (RBAC). Al definir aquí los permisos necesarios (ej: `user_management.read`), se crea una capa de gobernanza única donde es sencillo verificar y actualizar los requisitos de seguridad de cada endpoint sin navegar por múltiples archivos de controladores.
 * * DECISIONES CLAVE:
 * - Las rutas de autenticación básica (login, register, refresh) son públicas para permitir el acceso inicial.
 * - Las rutas de gestión (usuarios, roles, instituciones) están estrictamente protegidas por permisos granulares.
 */
exports.authRouter = new router_1.Router();
exports.authRouter.add("POST", "/api/upload/presigned-url", [(0, auth_middleware_1.requirePermission)("data_management.write")], upload_routes_1.generateUploadUrlAction);
exports.authRouter.add("POST", "/api/login", [], login_routes_1.loginAction);
exports.authRouter.add("POST", "/api/logout", [], logout_routes_1.logoutAction);
exports.authRouter.add("POST", "/api/register", [], register_routes_1.registerAction);
exports.authRouter.add("POST", "/api/verificar", [], verify_routes_1.verifyEmailAction);
exports.authRouter.add("POST", "/api/verificar/reenviar", [], verify_routes_1.resendVerificationAction);
exports.authRouter.add("POST", "/api/refresh", [], refresh_routes_1.refreshAction);
exports.authRouter.add("POST", "/api/recuperar-password", [], password_routes_1.requestPasswordResetAction);
exports.authRouter.add("POST", "/api/reset-password", [], password_routes_1.resetPasswordAction);
exports.authRouter.add("GET", "/api/usuarios", [(0, auth_middleware_1.requirePermission)("user_management.read")], usuarios_admin_routes_1.getUsuariosAction);
exports.authRouter.add("PATCH", "/api/usuarios/:id/estado", [(0, auth_middleware_1.requirePermission)("user_management.write")], usuarios_admin_routes_1.toggleEstadoAction);
exports.authRouter.add("DELETE", "/api/usuarios/:id", [(0, auth_middleware_1.requirePermission)("user_management.delete")], usuarios_admin_routes_1.deleteUsuarioAction);
exports.authRouter.add("PUT", "/api/usuarios/:id", [(0, auth_middleware_1.requirePermission)("user_management.write")], usuarios_admin_routes_1.editUsuarioAction);
exports.authRouter.add("GET", "/api/roles", [(0, auth_middleware_1.requirePermission)("user_management.read")], usuarios_admin_routes_1.getRolesAction);
// --- RUTAS DE GESTIÓN DE ROLES Y PERMISOS ---
exports.authRouter.add("GET", "/api/roles/detalles", [(0, auth_middleware_1.requirePermission)("roles_permissions.read")], roles_routes_1.getRolesDetailsAction);
exports.authRouter.add("GET", "/api/permisos", [(0, auth_middleware_1.requirePermission)("roles_permissions.read")], roles_routes_1.getPermisosAction);
exports.authRouter.add("POST", "/api/roles", [(0, auth_middleware_1.requirePermission)("roles_permissions.write")], roles_routes_1.createRoleAction);
exports.authRouter.add("PUT", "/api/roles/:id", [(0, auth_middleware_1.requirePermission)("roles_permissions.write")], roles_routes_1.updateRoleAction);
exports.authRouter.add("DELETE", "/api/roles/:id", [(0, auth_middleware_1.requirePermission)("roles_permissions.write")], roles_routes_1.deleteRoleAction);
// --- RUTAS DE INSTITUCIONES ---
exports.authRouter.add("GET", "/api/instituciones", [(0, auth_middleware_1.requirePermission)("admin_general.manage")], instituciones_routes_1.getInstitucionesAction);
exports.authRouter.add("POST", "/api/instituciones", [(0, auth_middleware_1.requirePermission)("admin_general.manage")], instituciones_routes_1.createInstitucionAction);
exports.authRouter.add("PUT", "/api/instituciones/:id", [(0, auth_middleware_1.requirePermission)("admin_general.manage")], instituciones_routes_1.updateInstitucionAction);
exports.authRouter.add("DELETE", "/api/instituciones/:id", [(0, auth_middleware_1.requirePermission)("admin_general.manage")], instituciones_routes_1.deleteInstitucionAction);
exports.authRouter.add("GET", "/api/public/instituciones", [], instituciones_routes_1.getPublicInstitucionesAction);
//---categorias---
exports.authRouter.add("GET", "/api/categories", [], categories_routes_1.getAllCategoriesAction);
exports.authRouter.add("GET", "/api/tags", [], tags_routes_1.getAllTagsAction);
exports.authRouter.add("GET", "/api/licenses", [], licenses_routes_1.getAllLicensesAction);
//---datasets
// 2. Busca la sección de RUTAS DE DATASETS al final del archivo y déjalas así:
exports.authRouter.add("GET", "/api/public/datasets", [], datasets_routes_1.getPublicDatasetsAction); // esto tambien agreguee
exports.authRouter.add("GET", "/api/public/datasets/:id", [], datasets_routes_1.getPublicDatasetByIdAction);
exports.authRouter.add("GET", "/api/datasets", [(0, auth_middleware_1.requirePermission)("catalog.read")], datasets_routes_1.getDatasetsAction);
exports.authRouter.add("POST", "/api/datasets", [(0, auth_middleware_1.requirePermission)("data_management.write")], datasets_routes_1.createDatasetAction);
exports.authRouter.add("GET", "/api/datasets/:id", [(0, auth_middleware_1.requirePermission)("catalog.read")], datasets_routes_1.getDatasetByIdAction);
exports.authRouter.add("PUT", "/api/datasets/:id", [(0, auth_middleware_1.requirePermission)("data_management.write")], datasets_routes_1.updateDatasetAction);
exports.authRouter.add("DELETE", "/api/datasets/:id", [(0, auth_middleware_1.requirePermission)("data_management.delete")], datasets_routes_1.deleteDatasetAction);
// 1. Busca donde tienes la ruta de presigned-url original y añade esta justo debajo:
exports.authRouter.add("POST", "/api/upload/presigned-url/user", [(0, auth_middleware_1.requirePermission)("user_management.write")], upload_routes_1.generateUploadUrlAction);
// 2. Busca la sección de datasets y añade la nueva ruta para las solicitudes de usuarios:
exports.authRouter.add("POST", "/api/datasets/request", [(0, auth_middleware_1.requirePermission)("user_management.write")], datasets_routes_1.requestDatasetAction);
exports.authRouter.add("POST", "/api/datasets/:id/validate", [(0, auth_middleware_1.requirePermission)("data_validation.execute")], datasets_routes_1.validateDatasetAction);
