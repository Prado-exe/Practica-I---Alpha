import dotenv from "dotenv";

dotenv.config();

function getEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;

  if (value === undefined) {
    throw new Error(`Falta la variable de entorno: ${name}`);
  }

  return value;
}

function getNumberEnv(name: string, defaultValue?: number): number {
  const raw = process.env[name] ?? (defaultValue !== undefined ? String(defaultValue) : undefined);

  if (raw === undefined) {
    throw new Error(`Falta la variable de entorno numérica: ${name}`);
  }

  const parsed = Number(raw);

  if (Number.isNaN(parsed)) {
    throw new Error(`La variable ${name} debe ser numérica`);
  }

  return parsed;
}

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

  ACCESS_TOKEN_EXPIRES_IN: getEnv("ACCESS_TOKEN_EXPIRES_IN", "15m"),
  REFRESH_TOKEN_EXPIRES_IN: getEnv("REFRESH_TOKEN_EXPIRES_IN", "7d"),

  ACCESS_TOKEN_EXPIRES_IN_MS: getNumberEnv("ACCESS_TOKEN_EXPIRES_IN_MS", 15 * 60 * 1000),
  REFRESH_TOKEN_EXPIRES_IN_MS: getNumberEnv("REFRESH_TOKEN_EXPIRES_IN_MS", 7 * 24 * 60 * 60 * 1000),

  S3_ENDPOINT: getEnv("S3_ENDPOINT", "http://localhost:9000"),
  S3_REGION: getEnv("S3_REGION", "us-east-1"),
  S3_ACCESS_KEY: getEnv("S3_ACCESS_KEY"),
  S3_SECRET_KEY: getEnv("S3_SECRET_KEY"),
  S3_BUCKET_NAME: getEnv("S3_BUCKET_NAME"),

  
} as const;