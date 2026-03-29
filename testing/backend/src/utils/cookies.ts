<<<<<<< HEAD
/**
 * ============================================================================
 * MÓDULO: Gestión de Cookies de Servidor (cookies.ts)
 * * PROPÓSITO: Proveer una interfaz para la creación, persistencia y 
 * eliminación de cookies en el navegador del cliente.
 * * RESPONSABILIDAD: Generar cadenas compatibles con la cabecera `Set-Cookie` 
 * y gestionar la inyección de múltiples cookies en la respuesta HTTP.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Soporte Multi-Cookie: El sistema está diseñado para no sobrescribir 
 * cabeceras previas. Detecta si ya existen otras cookies configuradas y las 
 * concatena en un arreglo, permitiendo que un solo endpoint establezca 
 * varios parámetros de estado simultáneamente.
 * - Abstracción de Seguridad: Centraliza las políticas de seguridad 
 * (HttpOnly, Secure, SameSite) para evitar errores de configuración manual 
 * en los controladores.
 * ============================================================================
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
import type { HttpResponse } from "../types/http";
import { env } from "../config/env";

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
  path?: string;
  maxAge?: number;
}

<<<<<<< HEAD
/**
 * Descripción: Construye la cadena de texto serializada para una cookie individual.
 * POR QUÉ: Utiliza `encodeURIComponent` en el valor para garantizar que 
 * caracteres reservados o especiales no rompan la estructura de la cabecera 
 * HTTP. La lógica de construcción mediante un arreglo y `join` 
 * asegura que no se añadan puntos y coma innecesarios si una opción es omitida.
 * @param name {string} Nombre identificador de la cookie.
 * @param value {string} Valor a almacenar.
 * @param options {CookieOptions} Configuración de visibilidad y vida útil.
 * @return {string} Cadena formateada para la cabecera Set-Cookie.
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
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

<<<<<<< HEAD
/**
 * Descripción: Inyecta una cookie en la cabecera de la respuesta HTTP actual.
 * POR QUÉ: Implementa una lógica de normalización de cabeceras. Dado que 
 * `res.getHeader` puede devolver un string único, un arreglo o undefined, la 
 * función convierte cualquier estado previo en un arreglo antes de añadir la 
 * nueva cookie. Esto es vital para que el servidor pueda, por ejemplo, 
 * enviar una cookie de sesión y una de preferencias en la misma respuesta 
 * sin que una borre a la otra.
 * @param res {HttpResponse} Objeto de respuesta del servidor.
 * @param name {string} Nombre de la cookie.
 * @param value {string} Contenido de la cookie.
 * @param options {CookieOptions} Atributos de seguridad y expiración.
 * @return {void}
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
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

<<<<<<< HEAD
/**
 * Descripción: Ordena al navegador eliminar una cookie específica.
 * POR QUÉ: Setea el valor a una cadena vacía y el `maxAge` a 0. Esta es la 
 * forma más compatible entre navegadores para forzar la expiración inmediata, 
 * invalidando el almacenamiento en el cliente de forma efectiva.
 * @param res {HttpResponse} Objeto de respuesta.
 * @param name {string} Nombre de la cookie a eliminar.
 * @param options {CookieOptions} Debe coincidir con el Path y Domain originales para que la eliminación sea exitosa.
 * @return {void}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
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

<<<<<<< HEAD
/**
 * Descripción: Configura de forma segura la cookie que transporta el Refresh Token.
 * POR QUÉ: 
 * - `httpOnly: true`: Bloquea el acceso desde JavaScript (document.cookie), 
 * mitigando drásticamente el robo de tokens mediante ataques XSS.
 * - `secure: isProduction`: Garantiza que el token solo viaje por canales 
 * cifrados en producción, permitiendo a la vez el desarrollo local en HTTP.
 * - `sameSite: Lax`: Ofrece un equilibrio de seguridad contra ataques CSRF 
 * permitiendo que la cookie se envíe en navegaciones de nivel superior (ej. links externos).
 * @param res {HttpResponse} Respuesta donde se inyectará el token.
 * @param refreshToken {string} Token de larga duración generado por el servicio de JWT.
 * @return {void}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
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

<<<<<<< HEAD
/**
 * Descripción: Elimina específicamente la cookie del Refresh Token.
 * POR QUÉ: Debe replicar exactamente las opciones de `path` y `sameSite` 
 * utilizadas en la creación para que el navegador identifique correctamente 
 * qué cookie debe purgar.
 * @param res {HttpResponse} Objeto de respuesta.
 * @return {void}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export function clearRefreshTokenCookie(res: HttpResponse): void {
  const isProduction = env.NODE_ENV === "production";

  clearCookie(res, "refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "Lax",
    path: "/",
  });
}