<<<<<<< HEAD
/**
 * ============================================================================
 * MÓDULO: Gestión de Variables de Entorno (env.ts)
 * * PROPÓSITO: Centralizar, validar y tipar todas las configuraciones externas 
 * de la aplicación.
 * * RESPONSABILIDAD: Cargar el archivo `.env`, transformar valores (strings a 
 * números/milisegundos) y asegurar que el sistema no inicie si faltan 
 * parámetros críticos.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Fail-Fast: El sistema lanza excepciones inmediatas si una variable obligatoria 
 * no existe, evitando comportamientos impredecibles en tiempo de ejecución.
 * - Soporte para Pruebas (Vitest): Implementa un "workaround" de valores ficticios 
 * automáticos cuando el entorno es `test`, permitiendo ejecutar pruebas unitarias 
 * sin necesidad de un archivo `.env` completo o configuraciones de CI complejas.
 * - Consistencia de Tiempos: Centraliza el parseo de tiempos (ej: "15m" a ms) para 
 * garantizar que los tokens JWT y las Cookies del navegador coincidan exactamente 
 * en sus tiempos de vida sin errores de cálculo manual.
 * ============================================================================
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
import dotenv from "dotenv";
import ms from "ms";

dotenv.config();

<<<<<<< HEAD
/**
 * Descripción: Recupera una variable de entorno de tipo string.
 * POR QUÉ: Incluye una lógica de "Magia para Vitest" que detecta si el entorno 
 * es de pruebas para retornar un valor genérico. Esto soluciona el problema de 
 * mantenibilidad en entornos de Integración Continua (CI) donde inyectar 
 * decenas de secretos para pruebas que no los usan es ineficiente.
 * @param name {string} Nombre de la variable de entorno.
 * @param defaultValue {string} (Opcional) Valor de respaldo si no existe.
 * @return {string} El valor de la variable o el valor por defecto.
 * @throws {Error} Si la variable es indefinida y no se está en entorno de pruebas.
 */
function getEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;

=======
function getEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;

  // 👇 MAGIA PARA VITEST: Evita el error y da un string falso en pruebas
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  if (process.env.NODE_ENV === "test" && value === undefined) {
    return "test_value";
  }

  if (value === undefined) {
    throw new Error(`Falta la variable de entorno: ${name}`);
  }

  return value;
}

<<<<<<< HEAD
/**
 * Descripción: Recupera y transforma una variable de entorno a tipo numérico.
 * POR QUÉ: Además del soporte para Vitest, implementa una validación estricta 
 * contra `NaN`. Esto es crítico para variables como `PORT` o `DB_PORT`, donde 
 * un valor no numérico causaría que el servidor falle silenciosamente o se 
 * comporte de forma errática en la red.
 * @param name {string} Nombre de la variable de entorno.
 * @param defaultValue {number} (Opcional) Valor numérico de respaldo.
 * @return {number} El valor transformado.
 * @throws {Error} Si el valor no es un número válido o está ausente.
 */
function getNumberEnv(name: string, defaultValue?: number): number {
  const raw = process.env[name] ?? (defaultValue !== undefined ? String(defaultValue) : undefined);

=======
function getNumberEnv(name: string, defaultValue?: number): number {
  const raw = process.env[name] ?? (defaultValue !== undefined ? String(defaultValue) : undefined);

  // 👇 MAGIA PARA VITEST: Evita el error y da un número falso en pruebas
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  if (process.env.NODE_ENV === "test" && raw === undefined) {
    return 9999;
  }

  if (raw === undefined) {
    throw new Error(`Falta la variable de entorno numérica: ${name}`);
  }

  const parsed = Number(raw);

<<<<<<< HEAD
=======
  // También evitamos errores si por casualidad llega un texto no numérico en test
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  if (process.env.NODE_ENV === "test" && Number.isNaN(parsed)) {
    return 9999;
  }

  if (Number.isNaN(parsed)) {
    throw new Error(`La variable ${name} debe ser numérica`);
  }

  return parsed;
}

const accessTokenTime = getEnv("ACCESS_TOKEN_EXPIRES_IN", "15m");
const refreshTokenTime = getEnv("REFRESH_TOKEN_EXPIRES_IN", "7d");

<<<<<<< HEAD
/**
 * Descripción: Objeto constante y de solo lectura que expone la configuración del sistema.
 * POR QUÉ: Se marca `as const` para proporcionar tipado fuerte (IntelliSense) en todo el proyecto. 
 * Realiza cálculos pre-procesados de milisegundos (`ACCESS_TOKEN_EXPIRES_IN_MS`) 
 * utilizando la librería `ms` para evitar que cada middleware o utilidad 
 * tenga que re-calcular estos valores, reduciendo la superficie de error lógico.
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export const env = {
  PORT: getNumberEnv("PORT", 3000),

  DB_HOST_POSTGRES: getEnv("DB_HOST_POSTGRES", "localhost"),
  DB_PORT: getNumberEnv("DB_PORT", 5432),
  DB_USER: getEnv("DB_USER"),
  DB_PASS: getEnv("DB_PASS"),
  DB_NAME: getEnv("DB_NAME"),

  SMTP_HOST: getEnv("SMTP_HOST"),
  SMTP_PORT: getNumberEnv("SMTP_PORT", 587),
  SMTP_USER: getEnv("SMTP_USER"),
  SMTP_PASS: getEnv("SMTP_PASS"),
  SMTP_FROM: getEnv("SMTP_FROM"),

  FRONTEND_ORIGIN: getEnv("FRONTEND_ORIGIN", "http://localhost:5173"),
  NODE_ENV: getEnv("NODE_ENV", "development"),

  JWT_ACCESS_SECRET: getEnv("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET"),

<<<<<<< HEAD
  ACCESS_TOKEN_EXPIRES_IN: accessTokenTime,
  REFRESH_TOKEN_EXPIRES_IN: refreshTokenTime,

=======
  // 2. Guardamos el texto (ej: "1h", "7d") para jsonwebtoken
  ACCESS_TOKEN_EXPIRES_IN: accessTokenTime,
  REFRESH_TOKEN_EXPIRES_IN: refreshTokenTime,

  // 3. Calculamos automáticamente los milisegundos para las Cookies (ej: 3600000)
  // En test, si ms falla devolvemos un valor genérico seguro
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  ACCESS_TOKEN_EXPIRES_IN_MS: ms(accessTokenTime as ms.StringValue) ?? 900000,
  REFRESH_TOKEN_EXPIRES_IN_MS: ms(refreshTokenTime as ms.StringValue) ?? 604800000,

  S3_ENDPOINT: getEnv("S3_ENDPOINT", "http://localhost:9000"),
  S3_REGION: getEnv("S3_REGION", "us-east-1"),
  S3_ACCESS_KEY: getEnv("S3_ACCESS_KEY"),
  S3_SECRET_KEY: getEnv("S3_SECRET_KEY"),
  S3_BUCKET_NAME: getEnv("S3_BUCKET_NAME"),

} as const;