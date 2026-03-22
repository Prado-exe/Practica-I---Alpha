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
  const authHeader =
    typeof req.headers.authorization === "string"
      ? req.headers.authorization
      : "";

  if (!authHeader.startsWith("Bearer ")) {
    throw new AppError("Token no proporcionado", 401);
  }

  const token = authHeader.replace("Bearer ", "").trim();

  let payload: JwtAccessPayload;

  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError("Token inválido o expirado", 401);
  }

  const session = await findAuthSessionById(payload.sessionId);

  if (!session) {
    throw new AppError("Sesión no encontrada", 401);
  }

  if (session.is_revoked) {
    throw new AppError("Sesión revocada", 401);
  }

  if (new Date(session.expires_at) <= new Date()) {
    throw new AppError("Sesión expirada", 401);
  }

  const account = await findAccountByIdForSession(payload.sub);

  if (!account) {
    throw new AppError("Cuenta no encontrada", 401);
  }

  if (!account.email_verified || account.account_status !== "active") {
    throw new AppError("La cuenta no está habilitada", 403);
  }

  await updateAuthSessionLastUsed(session.session_id);

  return payload;
}

export function tryGetAuthPayload(req: HttpRequest): JwtAccessPayload | null {
  const authHeader =
    typeof req.headers.authorization === "string"
      ? req.headers.authorization
      : "";

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