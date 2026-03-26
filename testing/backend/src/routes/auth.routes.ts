// src/routes/auth.routes.ts
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
import { registerAction } from "./register.routes";
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
  getPublicInstitucionesAction 
} from "./instituciones.routes";

import { getAllCategoriesAction } from "./categories.routes";
import { getDatasetsAction, createDatasetAction } from "./datasets.routes";
import { getAllOdsAction } from "./ods.routes";
import { getAllTagsAction } from "./tags.routes";
import { getAllLicensesAction} from "./licenses.routes";

// --- FUNCIONES DE AYUDA (Exportadas) ---
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

export function getErrorStatus(error: unknown): number {
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof ZodError) return 400;
  return 500;
}

export function getErrorMessage(error: unknown): any {
  if (error instanceof AppError) return error.message;
  if (error instanceof ZodError) return error.issues;
  return "Error interno del servidor";
}

// --- EL ENRUTADOR PRINCIPAL ---
export const authRouter = new Router();
authRouter.add("POST", "/api/upload/presigned-url", [], generateUploadUrlAction);
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

//---categorias---
authRouter.add("GET", "/api/categories", [], getAllCategoriesAction); 
authRouter.add("GET", "/api/tags", [], getAllTagsAction);
authRouter.add("GET", "/api/licenses", [], getAllLicensesAction);

authRouter.add("GET", "/api/datasets", [requireLogin], getDatasetsAction);
authRouter.add("POST", "/api/datasets", [requireLogin], createDatasetAction);


