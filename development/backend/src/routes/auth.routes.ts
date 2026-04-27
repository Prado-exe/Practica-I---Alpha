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

import { Router } from "../utils/router";
import type { HttpRequest } from "../types/http";
import { tryGetAuthPayload } from "../utils/auth";
import { parseCookies } from "../utils/request-cookies";
import { verifyRefreshToken } from "../utils/jwt";
import { AppError } from "../types/app-error";
import { ZodError } from "zod";


import { requirePermission, requireLogin } from "../middlewares/auth.middleware";


import { loginAction } from "./login.routes";
import { logoutAction } from "./logout.routes";
import { registerAction, adminCreateUserAction } from "./register.routes";
import { verifyEmailAction, resendVerificationAction } from "./verify.routes";
import { refreshAction } from "./refresh.routes";
import { requestPasswordResetAction, resetPasswordAction } from "./password.routes";
import { getUsuariosAction, toggleEstadoAction, deleteUsuarioAction, editUsuarioAction, getRolesAction } from "./usuarios-admin.routes";
import { generateUploadUrlAction } from "./upload.routes";

import { 
  getRolesDetailsAction, 
  getPermisosAction, 
  createRoleAction, 
  updateRoleAction, 
  deleteRoleAction 
} from "./roles.routes";

import { 
  getInstitucionesAction, 
  createInstitucionAction, 
  updateInstitucionAction, 
  deleteInstitucionAction,
  getPublicInstitucionesAction,
  getPublicInstitucionByIdAction,         // <--- AÑADIR ESTA
  getPublicInstitucionDatasetsAction 
} from "./instituciones.routes";

import { getAllCategoriesAction } from "./categories.routes";
import { 
  getDatasetsAction, 
  createDatasetAction, 
  getDatasetByIdAction, 
  archiveDatasetAction,
  unarchiveDatasetAction, 
  updateDatasetAction, 
  getPublicDatasetsAction,
  getPublicDatasetByIdAction,
  requestDatasetAction,
  validateDatasetAction,
  destroyDatasetAction,
  getDashboardStatsAction 
} from "./datasets.routes";
import { getAllOdsAction } from "./ods.routes";
import { getAllTagsAction, createTagAction, deleteTagAction } from "./tags.routes";
import { getAllLicensesAction} from "./licenses.routes";
import { 
  createNewsAction, 
  updateNewsAction, 
  deleteNewsAction, 
  getPublicNewsAction, 
  getAdminNewsAction,
  toggleVisibilityAction,
  getNewsCategoriesAction,
  getPublicNewsBySlugAction 
} from "./news.routes";

import { 
  submitContactAction, 
  getContactsAction, 
  markContactReadAction, 
  deleteContactAction,
  getContactByIdAction 
} from "./contact.routes";

/**
 * Descripción: Extrae el identificador de la sesión activa desde el Access Token o el Refresh Token.
 * POR QUÉ: Implementa una lógica de extracción de doble fuente. Primero intenta obtener el ID del payload del Access Token (transatómico/rápido). Si falla, recurre al Refresh Token en las cookies para asegurar la trazabilidad de la sesión incluso en flujos de renovación o cierre de sesión donde el token de acceso puede haber expirado o ser inexistente.
 * @param req {HttpRequest} Objeto de la petición con cabeceras y cookies.
 * @return {number | string | null} El ID de la sesión encontrada o null si no hay rastro de identidad.
 * @throws {Ninguna} Los errores de verificación de JWT se capturan internamente para retornar null de forma segura.
 */
export function getSessionIdFromRequest(req: HttpRequest): number | string | null {
  const accessPayload = tryGetAuthPayload(req);
  if (accessPayload?.sessionId) return accessPayload.sessionId;
  
  const cookies = parseCookies(req);
  const refreshToken = cookies.refreshToken;
  if (!refreshToken) return null;

  try {
    const refreshPayload = verifyRefreshToken(refreshToken);
    return refreshPayload.sessionId;
  } catch {
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
export function getErrorStatus(error: unknown): number {
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof ZodError) return 400;
  return 500;
}

/**
 * Descripción: Extrae o genera un mensaje de error seguro para ser enviado al cliente.
 * POR QUÉ: Estandariza la respuesta de error. En el caso de `ZodError`, devuelve el array completo de `issues` para permitir al frontend realizar validaciones de campo en tiempo real. Para errores no controlados, anonimiza el mensaje para evitar la filtración de información sensible de la infraestructura (stack traces, nombres de tablas, etc.).
 * @param error {unknown} Objeto de error capturado.
 * @return {any} String con el mensaje o array de objetos con detalles de validación.
 * @throws {Ninguna}
 */
export function getErrorMessage(error: unknown): any {
  if (error instanceof AppError) return error.message;
  if (error instanceof ZodError) return error.issues;
  return "Error interno del servidor";
}

/**
 * Descripción: Instancia configurada del enrutador que mapea la superficie de ataque y los recursos de la API.
 * POR QUÉ: Centraliza la política de Control de Acceso Basado en Roles (RBAC). Al definir aquí los permisos necesarios (ej: `user_management.read`), se crea una capa de gobernanza única donde es sencillo verificar y actualizar los requisitos de seguridad de cada endpoint sin navegar por múltiples archivos de controladores.
 * * DECISIONES CLAVE:
 * - Las rutas de autenticación básica (login, register, refresh) son públicas para permitir el acceso inicial.
 * - Las rutas de gestión (usuarios, roles, instituciones) están estrictamente protegidas por permisos granulares.
 */
export const authRouter = new Router();
authRouter.add("POST", "/api/upload/presigned-url", [requirePermission("data_management.write")], generateUploadUrlAction);
authRouter.add("POST", "/api/login", [], loginAction);
authRouter.add("POST", "/api/logout", [], logoutAction);
authRouter.add("POST", "/api/register", [], registerAction);

authRouter.add("POST", "/api/verificar", [], verifyEmailAction);
authRouter.add("POST", "/api/verificar/reenviar", [], resendVerificationAction);

authRouter.add("POST", "/api/refresh", [], refreshAction);

authRouter.add("POST", "/api/recuperar-password", [], requestPasswordResetAction);
authRouter.add("POST", "/api/reset-password", [], resetPasswordAction);

authRouter.add("GET", "/api/usuarios", [requirePermission("user_management.read")], getUsuariosAction);
authRouter.add("PATCH", "/api/usuarios/:id/estado", [requirePermission("user_management.write")], toggleEstadoAction);
authRouter.add("DELETE", "/api/usuarios/:id", [requirePermission("user_management.delete")], deleteUsuarioAction);
authRouter.add("PUT", "/api/usuarios/:id", [requirePermission("user_management.write")], editUsuarioAction);
authRouter.add("GET", "/api/roles", [requirePermission("user_management.read")], getRolesAction);

authRouter.add("POST", "/api/users/admin", [requirePermission("user_management.write")], adminCreateUserAction);
// --- RUTAS DE GESTIÓN DE ROLES Y PERMISOS ---
authRouter.add("GET", "/api/roles/detalles", [requirePermission("roles_permissions.read")], getRolesDetailsAction);
authRouter.add("GET", "/api/permisos", [requirePermission("roles_permissions.read")], getPermisosAction);
authRouter.add("POST", "/api/roles", [requirePermission("roles_permissions.write")], createRoleAction);
authRouter.add("PUT", "/api/roles/:id", [requirePermission("roles_permissions.write")], updateRoleAction);
authRouter.add("DELETE", "/api/roles/:id", [requirePermission("roles_permissions.write")], deleteRoleAction);

// --- RUTAS DE INSTITUCIONES ---
authRouter.add("GET", "/api/instituciones", [requirePermission("admin_general.manage")], getInstitucionesAction);
authRouter.add("POST", "/api/instituciones", [requirePermission("admin_general.manage")], createInstitucionAction);
authRouter.add("PUT", "/api/instituciones/:id", [requirePermission("admin_general.manage")], updateInstitucionAction);
authRouter.add("DELETE", "/api/instituciones/:id", [requirePermission("admin_general.manage")], deleteInstitucionAction);
authRouter.add("GET", "/api/public/instituciones", [], getPublicInstitucionesAction);
authRouter.add("GET", "/api/public/instituciones/:id", [], getPublicInstitucionByIdAction);            // <--- AÑADIR ESTA
authRouter.add("GET", "/api/public/instituciones/:id/datasets", [], getPublicInstitucionDatasetsAction); // <--- AÑADIR ESTA

//---categorias---
authRouter.add("GET", "/api/categories", [], getAllCategoriesAction); 
authRouter.add("GET", "/api/tags", [], getAllTagsAction);
authRouter.add("POST", "/api/tags", [requirePermission("admin_general.manage")], createTagAction);
authRouter.add("DELETE", "/api/tags/:id", [requirePermission("admin_general.manage")], deleteTagAction);
authRouter.add("GET", "/api/licenses", [], getAllLicensesAction);
authRouter.add("GET", "/api/ods", [], getAllOdsAction);

//---datasets
// 2. Busca la sección de RUTAS DE DATASETS al final del archivo y déjalas así:

authRouter.add("GET", "/api/dashboard/stats", [requirePermission("catalog.read")], getDashboardStatsAction);
authRouter.add("GET", "/api/public/datasets", [], getPublicDatasetsAction);
authRouter.add("GET", "/api/public/datasets/:id", [], getPublicDatasetByIdAction);
authRouter.add("GET", "/api/datasets", [requirePermission("catalog.read")], getDatasetsAction);
authRouter.add("POST", "/api/datasets", [requirePermission("data_management.write")], createDatasetAction);
authRouter.add("GET", "/api/datasets/:id", [requirePermission("catalog.read")], getDatasetByIdAction);
authRouter.add("PUT", "/api/datasets/:id", [requirePermission("data_management.write")], updateDatasetAction);
authRouter.add("PATCH", "/api/datasets/:id/archive", [requirePermission("data_management.delete")], archiveDatasetAction);
authRouter.add("PATCH", "/api/datasets/:id/unarchive", [requirePermission("data_management.delete")], unarchiveDatasetAction);
authRouter.add("DELETE", "/api/datasets/:id/hard", [requirePermission("data_management.delete")], destroyDatasetAction);

// 1. Busca donde tienes la ruta de presigned-url original y añade esta justo debajo:
authRouter.add("POST", "/api/upload/presigned-url/user", [requirePermission("user_management.write")], generateUploadUrlAction);

// 2. Busca la sección de datasets y añade la nueva ruta para las solicitudes de usuarios:
authRouter.add("POST", "/api/datasets/request", [requirePermission("user_management.write")], requestDatasetAction);
authRouter.add("POST", "/api/datasets/:id/validate", [requirePermission("data_validation.execute")], validateDatasetAction);

// --- RUTAS DE NOTICIAS ---
authRouter.add("GET", "/api/news-categories", [], getNewsCategoriesAction);
// Públicas
authRouter.add("GET", "/api/public/news", [], getPublicNewsAction);
authRouter.add("GET", "/api/public/news/:slug", [], getPublicNewsBySlugAction);
// Privadas (Administrador de contenido)

authRouter.add("GET", "/api/news/admin", [requirePermission("catalog.read")], getAdminNewsAction);
authRouter.add("POST", "/api/news", [requirePermission("catalog.write")], createNewsAction);
authRouter.add("PUT", "/api/news/:id", [requirePermission("catalog.write")], updateNewsAction);
authRouter.add("DELETE", "/api/news/:id", [requirePermission("catalog.write")], deleteNewsAction);
authRouter.add("PATCH", "/api/news/:id/visibility", [requirePermission("catalog.write")], toggleVisibilityAction);

// --- RUTAS DE CONTACTO ---
// Público (Formulario)
authRouter.add("POST", "/api/public/contact", [], submitContactAction);

// Privado (Administrador)
authRouter.add("GET", "/api/contact", [requirePermission("admin_general.manage")], getContactsAction);
authRouter.add("PATCH", "/api/contact/:id/read", [requirePermission("admin_general.manage")], markContactReadAction);
authRouter.add("DELETE", "/api/contact/:id", [requirePermission("admin_general.manage")], deleteContactAction);
authRouter.add("GET", "/api/contact/:id", [requirePermission("admin_general.manage")], getContactByIdAction);