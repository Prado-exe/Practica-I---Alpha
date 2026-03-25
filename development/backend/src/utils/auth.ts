import { AppError } from "../types/app-error";
import type { HttpRequest } from "../types/http";
import type { JwtAccessPayload } from "../types/auth";
import { verifyAccessToken } from "./jwt";
import {
  findAuthSessionById,
  updateAuthSessionLastUsed,
  findAccountByIdForSession,
} from "../repositories/auth.repository";

export async function requireAuth(req: HttpRequest): Promise<JwtAccessPayload> {
  // 1. Blindaje contra mayúsculas/minúsculas en los headers
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

  // 2. Verificación de Sesión en Base de Datos
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

  // 3. Verificación de Estado del Usuario en Base de Datos
  const account = await findAccountByIdForSession(payload.sub);

  if (!account) {
    console.warn(`⚠️ [Auth] Petición rechazada: La cuenta ID ${payload.sub} no existe.`);
    throw new AppError("Cuenta no encontrada", 401);
  }

  if (!account.email_verified || account.account_status !== "active") {
    console.warn(`⚠️ [Auth] Petición rechazada: La cuenta de ${account.email} está inactiva o sin verificar.`);
    throw new AppError("La cuenta no está habilitada", 403);
  }

  // 4. Si pasó todos los filtros, actualizamos su última actividad
  await updateAuthSessionLastUsed(session.session_id);

  return payload;
}

export function tryGetAuthPayload(req: HttpRequest): JwtAccessPayload | null {
  // Aplicamos el mismo blindaje de mayúsculas/minúsculas aquí
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