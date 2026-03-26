import dotenv from "dotenv";
import ms from "ms";

dotenv.config();

function getEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;

  // 👇 MAGIA PARA VITEST: Evita el error y da un string falso en pruebas
  if (process.env.NODE_ENV === "test" && value === undefined) {
    return "test_value";
  }

  if (value === undefined) {
    throw new Error(`Falta la variable de entorno: ${name}`);
  }

  return value;
}

function getNumberEnv(name: string, defaultValue?: number): number {
  const raw = process.env[name] ?? (defaultValue !== undefined ? String(defaultValue) : undefined);

  // 👇 MAGIA PARA VITEST: Evita el error y da un número falso en pruebas
  if (process.env.NODE_ENV === "test" && raw === undefined) {
    return 9999;
  }

  if (raw === undefined) {
    throw new Error(`Falta la variable de entorno numérica: ${name}`);
  }

  const parsed = Number(raw);

  // También evitamos errores si por casualidad llega un texto no numérico en test
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

  // 2. Guardamos el texto (ej: "1h", "7d") para jsonwebtoken
  ACCESS_TOKEN_EXPIRES_IN: accessTokenTime,
  REFRESH_TOKEN_EXPIRES_IN: refreshTokenTime,

  // 3. Calculamos automáticamente los milisegundos para las Cookies (ej: 3600000)
  // En test, si ms falla devolvemos un valor genérico seguro
  ACCESS_TOKEN_EXPIRES_IN_MS: ms(accessTokenTime as ms.StringValue) ?? 900000,
  REFRESH_TOKEN_EXPIRES_IN_MS: ms(refreshTokenTime as ms.StringValue) ?? 604800000,

  S3_ENDPOINT: getEnv("S3_ENDPOINT", "http://localhost:9000"),
  S3_REGION: getEnv("S3_REGION", "us-east-1"),
  S3_ACCESS_KEY: getEnv("S3_ACCESS_KEY"),
  S3_SECRET_KEY: getEnv("S3_SECRET_KEY"),
  S3_BUCKET_NAME: getEnv("S3_BUCKET_NAME"),

} as const;