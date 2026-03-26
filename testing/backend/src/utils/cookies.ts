import type { HttpResponse } from "../types/http";
import { env } from "../config/env";

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
  path?: string;
  maxAge?: number;
}

function buildCookie(name: string, value: string, options: CookieOptions = {}): string {
  const parts: string[] = [`${name}=${encodeURIComponent(value)}`];

  if (options.httpOnly) {
    parts.push("HttpOnly");
  }

  if (options.secure) {
    parts.push("Secure");
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  if (options.path) {
    parts.push(`Path=${options.path}`);
  }

  if (typeof options.maxAge === "number") {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  return parts.join("; ");
}

export function setCookie(
  res: HttpResponse,
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  const cookie = buildCookie(name, value, options);
  const current = res.getHeader("Set-Cookie");

  if (!current) {
    res.setHeader("Set-Cookie", cookie);
    return;
  }

  if (Array.isArray(current)) {
    res.setHeader("Set-Cookie", [...current, cookie]);
    return;
  }

  res.setHeader("Set-Cookie", [String(current), cookie]);
}

export function clearCookie(
  res: HttpResponse,
  name: string,
  options: CookieOptions = {}
): void {
  setCookie(res, name, "", {
    ...options,
    maxAge: 0,
  });
}

const isProduction = env.NODE_ENV === "production";

export function setRefreshTokenCookie(res: HttpResponse, refreshToken: string): void {
  // Si no está en producción, secure será false.
  const isProduction = env.NODE_ENV === "production";

  setCookie(res, "refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction, 
    sameSite: "Lax",      
    path: "/",
    maxAge: Math.floor(env.REFRESH_TOKEN_EXPIRES_IN_MS / 1000),
  });
}

export function clearRefreshTokenCookie(res: HttpResponse): void {
  const isProduction = env.NODE_ENV === "production";

  clearCookie(res, "refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "Lax",
    path: "/",
  });
}