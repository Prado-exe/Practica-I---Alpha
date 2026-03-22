import type { ServerResponse } from "http";
import { env } from "../config/env";

function buildCsp(): string {
  const frontendOrigin = env.FRONTEND_ORIGIN;

  const s3Origins = "https://*.s3.amazonaws.com https://*.s3.*.amazonaws.com";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    `connect-src 'self' ${frontendOrigin} ${s3Origins}`,
    `img-src 'self' data: blob: ${s3Origins}`,
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function applySecurityHeaders(res: ServerResponse): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", buildCsp());
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

  if (env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }
}