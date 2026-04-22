"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
/**
 * ============================================================================
 * MÓDULO: Gestión de JSON Web Tokens (jwt.ts)
 * * PROPÓSITO: Centralizar la lógica de generación y validación de tokens
 * para la autenticación y autorización de usuarios.
 * * RESPONSABILIDAD: Firmar y verificar Access Tokens y Refresh Tokens,
 * asegurando la integridad de los datos (payload) y el cumplimiento de los
 * tiempos de expiración.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Doble Secreto: Se utilizan secretos distintos (`JWT_ACCESS_SECRET` y
 * `JWT_REFRESH_SECRET`) para mitigar el impacto si una de las llaves se ve
 * comprometida.
 * - Validación Estricta: Se aplican validaciones de `issuer` y `audience` en
 * cada verificación para prevenir ataques de sustitución de tokens entre
 * diferentes entornos o aplicaciones.
 * - Normalización de Datos: El sistema fuerza la conversión de IDs (`sub`,
 * `sessionId`) a tipo numérico durante la verificación para garantizar la
 * consistencia en las capas de servicio y repositorio, independientemente
 * de cómo se hayan serializado originalmente.
 * ============================================================================
 */
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const app_error_1 = require("../types/app-error");
const JWT_ISSUER = "observatory-api";
const JWT_AUDIENCE = "observatory-client";
function isJwtPayload(value) {
    return typeof value !== "string";
}
function accessTokenExpiresInSeconds() {
    return Math.floor(env_1.env.ACCESS_TOKEN_EXPIRES_IN_MS / 1000);
}
function refreshTokenExpiresInSeconds() {
    return Math.floor(env_1.env.REFRESH_TOKEN_EXPIRES_IN_MS / 1000);
}
function buildAccessSignOptions() {
    return {
        expiresIn: accessTokenExpiresInSeconds(),
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    };
}
function buildRefreshSignOptions() {
    return {
        expiresIn: refreshTokenExpiresInSeconds(),
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    };
}
function buildAccessVerifyOptions() {
    return {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    };
}
function buildRefreshVerifyOptions() {
    return {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    };
}
/**
 * Descripción: Genera un Access Token firmado para sesiones de corta duración.
 * POR QUÉ: Utiliza las opciones de firma predefinidas que inyectan automáticamente el emisor y la audiencia, asegurando que el token solo sea válido para el cliente del Observatorio. La duración se extrae de la configuración centralizada de entorno.
 * @param payload {JwtAccessPayload} Datos del usuario y permisos a incluir en el token.
 * @return {string} Token JWT firmado.
 * @throws {Error} Si el secreto de acceso no está configurado o hay fallos en la librería de firma.
 */
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_ACCESS_SECRET, buildAccessSignOptions());
}
/**
 * Descripción: Genera un Refresh Token para la persistencia de sesiones prolongadas.
 * POR QUÉ: A diferencia del Access Token, este incluye un `tokenId` único que permite implementar rotación de tokens y detección de robos de sesión en el backend. Se firma con un secreto independiente para elevar la seguridad del flujo de renovación.
 * @param payload {JwtRefreshPayload} Identificadores necesarios para la renovación de sesión.
 * @return {string} Token JWT firmado.
 * @throws {Error} Ante fallos en la configuración o proceso de firma.
 */
function signRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, buildRefreshSignOptions());
}
/**
 * Descripción: Valida la integridad de un Access Token y extrae su contenido tipado.
 * POR QUÉ:
 * 1. Implementa una reconstrucción defensiva del payload: fuerza la conversión de `sub` y `sessionId` a `Number` para evitar errores de comparación en la lógica de negocio.
 * 2. Garantiza que `permissions` sea siempre un arreglo (incluso si viene vacío), protegiendo al middleware de autorización contra fallos de tipo "undefined".
 * 3. Mapea cualquier error de la librería (expiración, firma inválida) a una excepción `AppError` con estado 401 para una respuesta HTTP uniforme.
 * * FLUJO:
 * 1. Verifica la firma, emisor y audiencia.
 * 2. Valida la estructura del payload decodificado.
 * 3. Normaliza y retorna el objeto de identidad del usuario.
 * @param token {string} El token JWT recibido en las cabeceras de autorización.
 * @return {JwtAccessPayload} El payload normalizado y verificado.
 * @throws {AppError} (401) Si el token expiró, la firma es inválida o el payload está mal formado.
 */
function verifyAccessToken(token) {
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET, buildAccessVerifyOptions());
    }
    catch {
        throw new app_error_1.AppError("Token inválido o expirado", 401);
    }
    if (!isJwtPayload(decoded)) {
        throw new app_error_1.AppError("Token inválido", 401);
    }
    const sub = Number(decoded.sub);
    const sessionId = Number(decoded.sessionId);
    if (isNaN(sub) ||
        isNaN(sessionId) ||
        typeof decoded.email !== "string") {
        throw new app_error_1.AppError("Payload de access token inválido", 401);
    }
    return {
        sub,
        email: decoded.email,
        sessionId,
        role: decoded.role || "registered_user",
        permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [],
    };
}
/**
 * Descripción: Verifica y decodifica un Refresh Token para procesos de renovación.
 * POR QUÉ: Además de la validación estándar, este método asegura la presencia del `tokenId`, dato crítico para que el servicio de autenticación pueda verificar si el token ha sido revocado o ya utilizado en una rotación previa. Al igual que en el Access Token, normaliza los IDs a valores numéricos para mantener la integridad con la base de datos.
 * @param token {string} Token de refresco recibido generalmente desde las cookies.
 * @return {JwtRefreshPayload} Datos necesarios para identificar la sesión a renovar.
 * @throws {AppError} (401) Si el token es inválido, expiró o no contiene la estructura requerida.
 */
function verifyRefreshToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
        const sub = Number(decoded.sub);
        const sessionId = Number(decoded.sessionId);
        if (isNaN(sub) ||
            isNaN(sessionId) ||
            typeof decoded.email !== "string" ||
            typeof decoded.tokenId !== "string") {
            throw new app_error_1.AppError("Payload de refresh token inválido", 401);
        }
        return {
            sub,
            email: decoded.email,
            sessionId,
            tokenId: decoded.tokenId,
        };
    }
    catch (error) {
        if (error instanceof app_error_1.AppError)
            throw error;
        throw new app_error_1.AppError("Refresh token inválido o expirado", 401);
    }
}
