"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCookie = setCookie;
exports.clearCookie = clearCookie;
exports.setRefreshTokenCookie = setRefreshTokenCookie;
exports.clearRefreshTokenCookie = clearRefreshTokenCookie;
const env_1 = require("../config/env");
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
function buildCookie(name, value, options = {}) {
    const parts = [`${name}=${encodeURIComponent(value)}`];
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
function setCookie(res, name, value, options = {}) {
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
function clearCookie(res, name, options = {}) {
    setCookie(res, name, "", {
        ...options,
        maxAge: 0,
    });
}
const isProduction = env_1.env.NODE_ENV === "production";
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
function setRefreshTokenCookie(res, refreshToken) {
    // Si no está en producción, secure será false.
    const isProduction = env_1.env.NODE_ENV === "production";
    setCookie(res, "refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "Lax",
        path: "/",
        maxAge: Math.floor(env_1.env.REFRESH_TOKEN_EXPIRES_IN_MS / 1000),
    });
}
/**
 * Descripción: Elimina específicamente la cookie del Refresh Token.
 * POR QUÉ: Debe replicar exactamente las opciones de `path` y `sameSite`
 * utilizadas en la creación para que el navegador identifique correctamente
 * qué cookie debe purgar.
 * @param res {HttpResponse} Objeto de respuesta.
 * @return {void}
 */
function clearRefreshTokenCookie(res) {
    const isProduction = env_1.env.NODE_ENV === "production";
    clearCookie(res, "refreshToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: "Lax",
        path: "/",
    });
}
