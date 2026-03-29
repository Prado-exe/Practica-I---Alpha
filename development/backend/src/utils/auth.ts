<<<<<<< HEAD
=======
/**
 * ============================================================================
 * MÓDULO: Lógica de Autenticación y Validación de Sesión (auth.ts)
 * * PROPÓSITO: Centralizar la validación de identidad y el control de estado 
 * de las sesiones activas en el sistema.
 * * RESPONSABILIDAD: Actuar como el núcleo de seguridad que verifica no solo 
 * la validez técnica de un JWT, sino también su vigencia lógica en la base 
 * de datos y el estado actual del usuario.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Doble Verificación (JWT + DB): Aunque los JWT son stateless por naturaleza, 
 * el sistema realiza una consulta a la base de datos por cada petición 
 * protegida. Esto permite la invalidación instantánea de 
 * sesiones (revocación) y el bloqueo de cuentas sin tener que esperar a que 
 * el token expire físicamente.
 * - Blindaje de Cabeceras: Se implementa una normalización manual para los 
 * headers de autorización para soportar variaciones en el casing (Authorization 
 * vs authorization) comunes en diferentes proxies, balanceadores y clientes 
 * HTTP.
 * ============================================================================
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
import { AppError } from "../types/app-error";
import type { HttpRequest } from "../types/http";
import type { JwtAccessPayload } from "../types/auth";
import { verifyAccessToken } from "./jwt";
import {
  findAuthSessionById,
  updateAuthSessionLastUsed,
  findAccountByIdForSession,
} from "../repositories/auth.repository";

<<<<<<< HEAD
export async function requireAuth(req: HttpRequest): Promise<JwtAccessPayload> {
  // 1. Blindaje contra mayúsculas/minúsculas en los headers
=======
/**
 * Descripción: Función de blindaje que garantiza que una petición está plenamente autorizada antes de permitir el acceso al controlador.
 * POR QUÉ: Implementa una jerarquía de validación crítica. Primero valida la integridad del token; luego, consulta la persistencia para confirmar que la sesión no ha sido revocada (permitiendo cierres de sesión efectivos); y finalmente, verifica el estado del usuario (email verificado y cuenta activa) para bloquear accesos a cuentas suspendidas en tiempo real. Además, actualiza la fecha de último uso (`last_used`) para auditoría de actividad e inactividad.
 * * FLUJO:
 * 1. Extrae el token del header gestionando variaciones de mayúsculas.
 * 2. Valida la firma y expiración técnica del JWT mediante `verifyAccessToken`.
 * 3. Verifica en la base de datos que la sesión exista, no esté revocada ni expirada en el registro de sesiones.
 * 4. Valida que el usuario dueño de la sesión tenga su cuenta habilitada y verificada.
 * 5. Actualiza la fecha de última actividad de la sesión para trazabilidad.
 * @param req {HttpRequest} Objeto de la petición entrante con cabeceras de autorización.
 * @return {Promise<JwtAccessPayload>} El payload decodificado y validado del usuario.
 * @throws {AppError} (401) Si el token falta, es inválido, la sesión no existe, está revocada o expirada.
 * @throws {AppError} (403) Si la cuenta del usuario no está verificada o está inactiva.
 */
export async function requireAuth(req: HttpRequest): Promise<JwtAccessPayload> {
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  const rawHeader = req.headers.authorization || req.headers.Authorization;
  const authHeader = typeof rawHeader === "string" ? rawHeader : "";

  if (!authHeader.startsWith("Bearer ")) {
    console.warn("⚠️ [Auth] Petición rechazada: Header Authorization no proporcionado o mal formado.");
    throw new AppError("Token no proporcionado", 401);
  }

  const token = authHeader.replace("Bearer ", "").trim();
  let payload: JwtAccessPayload;

  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    console.error("❌ [Auth] Petición rechazada: verifyAccessToken falló.", error);
    throw new AppError("Token inválido o expirado", 401);
  }

<<<<<<< HEAD
  // 2. Verificación de Sesión en Base de Datos
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  const session = await findAuthSessionById(payload.sessionId);

  if (!session) {
    console.warn(`⚠️ [Auth] Petición rechazada: Sesión ID ${payload.sessionId} no existe en la BD.`);
    throw new AppError("Sesión no encontrada", 401);
  }

  if (session.is_revoked) {
    console.warn(`⚠️ [Auth] Petición rechazada: La Sesión ID ${payload.sessionId} fue revocada.`);
    throw new AppError("Sesión revocada", 401);
  }

  if (new Date(session.expires_at) <= new Date()) {
    console.warn(`⚠️ [Auth] Petición rechazada: La Sesión en BD expiró el ${session.expires_at}.`);
    throw new AppError("Sesión expirada", 401);
  }

<<<<<<< HEAD
  // 3. Verificación de Estado del Usuario en Base de Datos
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  const account = await findAccountByIdForSession(payload.sub);

  if (!account) {
    console.warn(`⚠️ [Auth] Petición rechazada: La cuenta ID ${payload.sub} no existe.`);
    throw new AppError("Cuenta no encontrada", 401);
  }

  if (!account.email_verified || account.account_status !== "active") {
    console.warn(`⚠️ [Auth] Petición rechazada: La cuenta de ${account.email} está inactiva o sin verificar.`);
    throw new AppError("La cuenta no está habilitada", 403);
  }

<<<<<<< HEAD
  // 4. Si pasó todos los filtros, actualizamos su última actividad
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  await updateAuthSessionLastUsed(session.session_id);

  return payload;
}

<<<<<<< HEAD
export function tryGetAuthPayload(req: HttpRequest): JwtAccessPayload | null {
  // Aplicamos el mismo blindaje de mayúsculas/minúsculas aquí
=======
/**
 * Descripción: Intenta extraer la identidad del usuario sin forzar el error si la autenticación falta o falla.
 * POR QUÉ: Esta función es necesaria para rutas "híbridas" donde el contenido puede cambiar si el usuario está autenticado (ej: mostrar favoritos), pero el acceso no está prohibido para visitantes anónimos. A diferencia de `requireAuth`, esta función omite la validación contra la base de datos por razones de rendimiento, asumiendo que el controlador posterior manejará la lógica de visualización si el payload es nulo.
 * @param req {HttpRequest} Petición entrante.
 * @return {JwtAccessPayload | null} Los datos del usuario si el token es válido, o null en cualquier otro caso.
 * @throws {Ninguna} Silencia internamente los errores de validación de JWT para retornar null de forma segura.
 */
export function tryGetAuthPayload(req: HttpRequest): JwtAccessPayload | null {
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  const rawHeader = req.headers.authorization || req.headers.Authorization;
  const authHeader = typeof rawHeader === "string" ? rawHeader : "";

  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}