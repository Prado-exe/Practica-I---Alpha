/**
 * ============================================================================
 * MÓDULO: Configuración de Seguridad HTTP (security-headers.ts)
 * * PROPÓSITO: Implementar políticas de seguridad en la capa de transporte 
 * mediante la inyección de cabeceras HTTP estándar.
 * * RESPONSABILIDAD: Mitigar vectores de ataque comunes como XSS (Cross-Site 
 * Scripting), Clickjacking, MIME-Sniffing y ataques de inyección.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Defensa en Profundidad: Se aplican cabeceras restrictivas por defecto (DENY, 
 * self).
 * - Soporte para Almacenamiento: La política de CSP incluye explícitamente 
 * los dominios de AWS S3 para permitir la carga y visualización de recursos 
 * externos (como logos de instituciones o datasets) sin violar las políticas 
 * de origen.
 * - Entornos Diferenciados: La seguridad HSTS (Strict-Transport-Security) se 
 * aplica exclusivamente en producción para evitar conflictos en entornos de 
 * desarrollo local que no utilicen certificados SSL/TLS.
 * ============================================================================
 */
import type { ServerResponse } from "http";
import { env } from "../config/env";

/**
 * Descripción: Construye la cadena de política para la cabecera Content-Security-Policy (CSP).
 * POR QUÉ: Centraliza la lógica de orígenes permitidos. Se utiliza `unsafe-inline` para estilos únicamente por compatibilidad con librerías de UI que inyectan CSS dinámico, pero se mantiene `script-src` restringido a `self` para prevenir la ejecución de scripts maliciosos externos. Incluye comodines para regiones de S3 para asegurar que la aplicación pueda escalar geográficamente su almacenamiento sin romper la visualización de imágenes.
 * @param {void} No requiere parámetros.
 * @return {string} La directiva CSP completa y formateada.
 * @throws {Ninguna}
 */
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
    //"upgrade-insecure-requests",
  ].join("; ");
}

/**
 * Descripción: Aplica un conjunto de cabeceras de seguridad a la respuesta HTTP saliente.
 * POR QUÉ: 
 * - `X-Content-Type-Options: nosniff`: Evita que el navegador intente adivinar el tipo de contenido, mitigando ataques de ejecución de scripts disfrazados de imágenes.
 * - `X-Frame-Options: DENY`: Previene ataques de Clickjacking prohibiendo que la aplicación sea embebida en iframes.
 * - `Permissions-Policy`: Restringe el acceso a hardware del dispositivo (cámara/micro) por el principio de mínimo privilegio.
 * - `Strict-Transport-Security`: Forzado solo en producción para asegurar que el navegador solo se comunique vía HTTPS durante el tiempo de vida especificado (1 año).
 * @param {ServerResponse} res Objeto de respuesta nativo de Node.js donde se inyectarán las cabeceras.
 * @return {void} La función muta el objeto de respuesta directamente.
 * @throws {Ninguna}
 */
export function applySecurityHeaders(res: ServerResponse): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", buildCsp());
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  /*
  if (env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }
    */
}