import jwt, { type JwtPayload, type SignOptions, type VerifyOptions } from "jsonwebtoken";
import { env } from "../config/env";
import type { JwtAccessPayload, JwtRefreshPayload } from "../types/auth";
import { AppError } from "../types/app-error";

const JWT_ISSUER = "observatory-api";
const JWT_AUDIENCE = "observatory-client";

function isJwtPayload(value: string | JwtPayload): value is JwtPayload {
  return typeof value !== "string";
}

function accessTokenExpiresInSeconds(): number {
  return Math.floor(env.ACCESS_TOKEN_EXPIRES_IN_MS / 1000);
}

function refreshTokenExpiresInSeconds(): number {
  return Math.floor(env.REFRESH_TOKEN_EXPIRES_IN_MS / 1000);
}

function buildAccessSignOptions(): SignOptions {
  return {
    expiresIn: accessTokenExpiresInSeconds(),
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  };
}

function buildRefreshSignOptions(): SignOptions {
  return {
    expiresIn: refreshTokenExpiresInSeconds(),
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  };
}

function buildAccessVerifyOptions(): VerifyOptions {
  return {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  };
}

function buildRefreshVerifyOptions(): VerifyOptions {
  return {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  };
}

export function signAccessToken(payload: JwtAccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, buildAccessSignOptions());
}

export function signRefreshToken(payload: JwtRefreshPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, buildRefreshSignOptions());
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  let decoded: string | JwtPayload;

  try {
    decoded = jwt.verify(
      token,
      env.JWT_ACCESS_SECRET,
      buildAccessVerifyOptions()
    );
  } catch {
    throw new AppError("Token inválido o expirado", 401);
  }

  if (!isJwtPayload(decoded)) {
    throw new AppError("Token inválido", 401);
  }

  if (
    typeof decoded.sub !== "number" ||
    typeof decoded.email !== "string" ||
    typeof decoded.sessionId !== "number"
  ) {
    throw new AppError("Payload de access token inválido", 401);
  }

  return {
    sub: decoded.sub,
    email: decoded.email,
    sessionId: decoded.sessionId,
  };
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as any;

    // Convertimos explícitamente a número lo que sea que venga de la base de datos
    const sub = Number(decoded.sub);
    const sessionId = Number(decoded.sessionId);

    
    if (
      isNaN(sub) ||
      isNaN(sessionId) ||
      typeof decoded.email !== "string" ||
      typeof decoded.tokenId !== "string"
    ) {
      throw new AppError("Payload de refresh token inválido", 401);
    }

    return {
      sub,
      email: decoded.email,
      sessionId,
      tokenId: decoded.tokenId,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Refresh token inválido o expirado", 401);
  }
}