import crypto from "crypto";

/**
 * Genera un token aleatorio criptográficamente seguro.
 * @param bytes Longitud en bytes (por defecto 32 bytes = 64 caracteres hex)
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Aplica un hash SHA-256 a un token para guardarlo de forma segura en la BD.
 * @param token El token original en texto plano
 */
export function hashSecureToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}