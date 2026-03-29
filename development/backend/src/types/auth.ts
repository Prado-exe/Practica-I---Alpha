<<<<<<< HEAD
=======
/**
 * ============================================================================
 * MÓDULO: Modelos y Tipos de Autenticación (auth.ts)
 * * PROPÓSITO: Centralizar los contratos de datos (Interfaces) para usuarios, 
 * sesiones, códigos de verificación y payloads de seguridad.
 * * RESPONSABILIDAD: Definir la estructura de los objetos que fluyen entre la 
 * base de datos, los servicios y los tokens JWT, garantizando integridad de 
 * tipos en todo el ciclo de vida de la identidad.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Fragmentación de Modelos (Account): Se implementa una jerarquía de interfaces 
 * (`Basic`, `Login`, `Public`) para aplicar el principio de "Mínima Exposición 
 * de Datos". Esto evita que campos sensibles como el hash de 
 * la contraseña o contadores de fallos de login viajen accidentalmente hacia 
 * el frontend o capas externas del sistema.
 * - Auditoría de Seguridad: Las interfaces de `AuthSession` y 
 * `VerificationCodeRecord` están diseñadas para soportar rastreo forense, 
 * incluyendo IP, User-Agent, conteo de intentos y motivos de revocación.
 * - Desacoplamiento de Tokens: Los payloads de JWT (`Access` vs `Refresh`) se 
 * definen de forma independiente para que el contenido del token no esté 
 * amarrado estrictamente a la estructura de la tabla de base de datos.
 * ============================================================================
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export interface Account {
  account_id: number;
  role_id: number;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  account_status: string;
  email_verified: boolean;
  failed_login_count?: number;
  locked_until?: string | Date | null;
  last_login_at?: string | Date | null;
  last_password_change_at?: string | Date | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface BasicAccount {
  account_id: number;
  role_id: number;
  username: string;
  email: string;
  full_name: string;
  account_status: string;
  email_verified: boolean;
}

export interface LoginAccount extends BasicAccount {
  password_hash: string;
  failed_login_count?: number;
  locked_until?: string | Date | null;
  role_code?: string;
  permissions?: string[];
}

export interface VerificationCodeRecord {
  verification_code_id: number;
  account_id: number;
  code_type: "register_email" | "account_reverification";
  channel: "email";
  destination: string;
  destination_masked?: string | null;
  code_hash: string;
  expires_at: string | Date;
  consumed_at?: string | Date | null;
  invalidated_at?: string | Date | null;
  invalidation_reason?: string | null;
  attempts_count: number;
  max_attempts: number;
  resend_count: number;
  last_sent_at?: string | Date | null;
  blocked_until?: string | Date | null;
  created_at: string | Date;
}

export interface AuthSession {
  session_id: number;
  account_id: number;
  current_refresh_token_id: string;
  refresh_token_hash?: string;
  is_revoked: boolean;
  revoked_at?: string | Date | null;
  revocation_reason?: string | null;
  expires_at: string | Date;
  last_used_at?: string | Date | null;
  last_rotated_at?: string | Date | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface PublicAccount {
  account_id: number;
  username: string;
  email: string;
  full_name: string;
  account_status: string;
  email_verified: boolean;
  role: string;
  permissions: string[];
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface VerifyEmailCodeInput {
  email: string;
  codigo: string;
}

export interface LoginMeta {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface JwtAccessPayload {
  sub: number | string;
  email: string;
  sessionId: number | string;
  role: string;
  permissions: string[];
}

export interface JwtRefreshPayload {
  sub: number;
  email: string;
  sessionId: number;
  tokenId: string;
}

export interface CreateAccountInput {
  roleId: number;
  username: string;
  email: string;
  passwordHash: string;
  fullName: string;
  accountStatus: string;
}

export interface CreateVerificationCodeInput {
  accountId: number;
  codeHash: string;
  destination: string;
  destinationMasked: string;
  expiresAt: Date;
}

export interface CreateAuthSessionInput {
  accountId: number;
  currentRefreshTokenId: string;
  refreshTokenHash: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceId?: string | null;
  deviceName?: string | null;
  sessionType?: string | null;
  expiresAt: Date;
}