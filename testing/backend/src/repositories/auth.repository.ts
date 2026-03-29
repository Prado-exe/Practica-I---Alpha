<<<<<<< HEAD
/**
 * ============================================================================
 * MÓDULO: Repositorio de Autenticación y Usuarios (auth.repository.ts)
 * * PROPÓSITO: Centralizar toda la interacción directa con la base de datos 
 * para las entidades de cuentas, sesiones, roles y tokens de seguridad.
 * * RESPONSABILIDAD: Ejecutar sentencias SQL parametrizadas para garantizar 
 * la seguridad contra inyecciones SQL (SQLi) y mapear los resultados crudos 
 * de la base de datos a interfaces fuertemente tipadas de TypeScript.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Auditoría por diseño: En lugar de usar sentencias `DELETE` para sesiones 
 * o tokens consumidos, se utilizan actualizaciones de estado (ej. `is_revoked = TRUE`, 
 * `consumed_at = NOW()`). Esto mantiene un rastro histórico vital para 
 * auditorías de seguridad y análisis forense post-incidente.
 * - Eficiencia de Red: Muchas consultas utilizan la cláusula `RETURNING` de 
 * PostgreSQL para mutar datos y obtener el registro actualizado en un solo 
 * viaje a la base de datos.
 * ============================================================================
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
import { pool } from "../config/db";
import { AppError } from "../types/app-error";
import type {
  Account,
  AuthSession,
  BasicAccount,
  CreateAccountInput,
  CreateAuthSessionInput,
  CreateVerificationCodeInput,
  LoginAccount,
  VerificationCodeRecord,
} from "../types/auth";

<<<<<<< HEAD
/**
 * Descripción: Resuelve el identificador interno numérico de un rol a partir de su código de texto.
 * POR QUÉ: La base de datos utiliza claves foráneas enteras (`role_id`) por eficiencia de indexación, pero la capa de servicio y controladores operan con cadenas (ej. 'admin') para mayor legibilidad del código.
 * @param code {string} Código de texto del rol.
 * @return {Promise<number | null>} ID numérico del rol o null si no existe.
 * @throws {Ninguna} Errores de BD burbujean.
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function findRoleIdByCode(code: string): Promise<number | null> {
  const query = `
    SELECT role_id
    FROM roles
    WHERE code = $1
    LIMIT 1
  `;

  const { rows } = await pool.query<{ role_id: number }>(query, [code]);
  return rows[0]?.role_id ?? null;
}

<<<<<<< HEAD
/**
 * Descripción: Busca una cuenta completa utilizando su correo electrónico.
 * POR QUÉ: Se limita explícitamente a `LIMIT 1` para asegurar que el motor de PostgreSQL detenga la búsqueda en el índice tan pronto encuentre la coincidencia (aunque la columna sea unique), optimizando milisegundos.
 * @param email {string} Correo del usuario.
 * @return {Promise<Account | null>} Registro de la cuenta.
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function findAccountByEmail(email: string): Promise<Account | null> {
  const query = `
    SELECT
      account_id,
      username,
      email,
      password_hash,
      full_name,
      account_status,
      email_verified,
      created_at
    FROM accounts
    WHERE email = $1
    LIMIT 1
  `;

  const { rows } = await pool.query<Account>(query, [email]);
  return rows[0] ?? null;
}

<<<<<<< HEAD
/**
 * Descripción: Busca una cuenta completa utilizando su nombre de usuario.
 * @param username {string} Nombre de usuario único.
 * @return {Promise<Account | null>} Registro de la cuenta.
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function findAccountByUsername(username: string): Promise<Account | null> {
  const query = `
    SELECT
      account_id,
      username,
      email,
      password_hash,
      full_name,
      account_status,
      email_verified,
      created_at
    FROM accounts
    WHERE username = $1
    LIMIT 1
  `;

  const { rows } = await pool.query<Account>(query, [username]);
  return rows[0] ?? null;
}

<<<<<<< HEAD
/**
 * Descripción: Inserta una nueva cuenta en la base de datos.
 * POR QUÉ: Se omite intencionalmente retornar el `password_hash` en el bloque `RETURNING` para evitar que la credencial encriptada viaje innecesariamente hacia la capa de servicio, reduciendo la superficie de exposición en memoria.
 * @param input {CreateAccountInput} Datos iniciales de la cuenta.
 * @return {Promise<BasicAccount>} Perfil básico del usuario recién creado.
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function createAccount(input: CreateAccountInput): Promise<BasicAccount> {
  const query = `
    INSERT INTO accounts (
      role_id,
      username,
      email,
      password_hash,
      full_name,
      account_status,
      email_verified,
      registration_started_at,
      created_at,
      updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, FALSE, NOW(), NOW(), NOW()
    )
    RETURNING
      account_id,
      role_id,
      username,
      email,
      full_name,
      account_status,
      email_verified
  `;

  const values = [
    input.roleId,
    input.username,
    input.email,
    input.passwordHash,
    input.fullName,
    input.accountStatus,
  ];

  const { rows } = await pool.query<BasicAccount>(query, values);
  return rows[0];
}

<<<<<<< HEAD
/**
 * Descripción: Crea un nuevo registro de código OTP en la base de datos.
 * POR QUÉ: Hardcodea la política base de seguridad directamente en el insert (`attempts_count = 0`, `max_attempts = 5`). Esto garantiza que, incluso si la capa de servicio olvida enviar estos parámetros, la base de datos nazca con límites defensivos estrictos.
 * @param input {CreateVerificationCodeInput} Detalles del código, destino y vigencia.
 * @return {Promise<Object>} ID interno del código y su fecha de expiración.
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function createVerificationCode(
  input: CreateVerificationCodeInput
): Promise<{ verification_code_id: number; expires_at: string | Date }> {
  const query = `
    INSERT INTO verification_codes (
      account_id,
      code_type,
      channel,
      destination,
      destination_masked,
      code_hash,
      expires_at,
      attempts_count,
      max_attempts,
      resend_count,
      last_sent_at,
      created_at
    )
    VALUES (
      $1,
      'register_email',
      'email',
      $2,
      $3,
      $4,
      $5,
      0,
      5,
      0,
      NOW(),
      NOW()
    )
    RETURNING verification_code_id, expires_at
  `;

  const values = [
    input.accountId,
    input.destination,
    input.destinationMasked,
    input.codeHash,
    input.expiresAt,
  ];

  const { rows } = await pool.query<{ verification_code_id: number; expires_at: string | Date }>(
    query,
    values
  );

  return rows[0];
}

<<<<<<< HEAD
/**
 * Descripción: Obtiene el perfil del usuario junto con su rol y matriz completa de permisos condensada.
 * POR QUÉ: Utiliza la función `json_agg` nativa de PostgreSQL para colapsar todos los permisos individuales asociados al rol en un solo array JSON. Esto evita el problema de las "N+1 consultas" (buscar el usuario y luego hacer un select por cada permiso), resolviendo toda la autorización en un solo viaje a la BD.
 * @param email {string} Correo del usuario a loguear.
 * @return {Promise<LoginAccount | null>} Objeto de cuenta enriquecido con permisos.
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function findAccountLoginByEmail(email: string): Promise<LoginAccount | null> {
  const query = `
    SELECT
      a.account_id,
      a.username,
      a.email,
      a.password_hash,
      a.full_name,
      a.account_status,
      a.email_verified,
      a.failed_login_count,
      a.locked_until,
      r.code AS role_code,
      COALESCE(
        json_agg(p.code) FILTER (WHERE p.code IS NOT NULL), 
        '[]'
      ) AS permissions
    FROM accounts a
    JOIN roles r ON a.role_id = r.role_id
    LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
    LEFT JOIN permissions p ON rp.permission_id = p.permission_id AND p.is_active = TRUE
    WHERE a.email = $1
    GROUP BY 
      a.account_id,
      r.role_id,
      r.code
    LIMIT 1
  `;

  const { rows } = await pool.query<LoginAccount>(query, [email]);
  return rows[0] ?? null;
}

<<<<<<< HEAD
/**
 * Descripción: Búsqueda ultra-ligera de datos públicos de una cuenta.
 * POR QUÉ: Excluye hashes y timestamps de auditoría. Se utiliza en flujos de reenvío de correos o validaciones rápidas donde cargar la entidad completa implicaría un gasto de memoria RAM innecesario en el servidor Node.js.
 * @param email {string} Correo de la cuenta.
 * @return {Promise<BasicAccount | null>} Datos esenciales del usuario.
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function findAccountBasicByEmail(email: string): Promise<BasicAccount | null> {
  const query = `
    SELECT
      account_id,
      username,
      email,
      full_name,
      account_status,
      email_verified
    FROM accounts
    WHERE email = $1
    LIMIT 1
  `;

  const { rows } = await pool.query<BasicAccount>(query, [email]);
  return rows[0] ?? null;
}

<<<<<<< HEAD
/**
 * Descripción: Recupera el código OTP más reciente emitido para un flujo específico de un usuario.
 * POR QUÉ: El ordenamiento `ORDER BY created_at DESC LIMIT 1` y el filtro `code_type` son críticos. Garantizan que el sistema solo evalúe el *último* código solicitado, previniendo bugs donde un usuario solicita dos códigos rápidos y el sistema evalúa el primero que ya caducó lógicamente.
 * @param accountId {number} ID del usuario.
 * @param codeType {string} Contexto del código (ej. registro o revalidación).
 * @return {Promise<VerificationCodeRecord | null>} El registro del código más reciente.
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function findLatestVerificationCodeByAccountId(
  accountId: number,
  codeType: "register_email" | "account_reverification"
): Promise<VerificationCodeRecord | null> {
  const query = `
    SELECT
      verification_code_id,
      account_id,
      code_type,
      channel,
      destination,
      destination_masked,
      code_hash,
      expires_at,
      consumed_at,
      invalidated_at,
      invalidation_reason,
      attempts_count,
      max_attempts,
      resend_count,
      last_sent_at,
      blocked_until,
      created_at
    FROM verification_codes
    WHERE account_id = $1
      AND code_type = $2
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const { rows } = await pool.query<VerificationCodeRecord>(query, [accountId, codeType]);
  return rows[0] ?? null;
}

<<<<<<< HEAD
/**
 * Descripción: Incrementa atómicamente el contador de intentos fallidos de inicio de sesión.
 * POR QUÉ: Se ejecuta como una operación matemática directa en el motor (`failed_login_count + 1`) en lugar de leer el valor en Node y actualizarlo. Esto previene condiciones de carrera si el atacante lanza peticiones simultáneas masivas.
 * @param accountId {number} ID del usuario.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function incrementFailedLoginAttempts(accountId: number): Promise<void> {
  const query = `
    UPDATE accounts
    SET
      failed_login_count = failed_login_count + 1,
      updated_at = NOW()
    WHERE account_id = $1
  `;

  await pool.query(query, [accountId]);
}

<<<<<<< HEAD
/**
 * Descripción: Limpia el registro de intentos fallidos y levanta los bloqueos temporales.
 * @param accountId {number} ID del usuario autenticado correctamente.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function resetFailedLoginAttempts(accountId: number): Promise<void> {
  const query = `
    UPDATE accounts
    SET
      failed_login_count = 0,
      locked_until = NULL,
      updated_at = NOW()
    WHERE account_id = $1
  `;

  await pool.query(query, [accountId]);
}

<<<<<<< HEAD
/**
 * Descripción: Establece una marca de tiempo en el futuro hasta la cual la cuenta no puede loguearse.
 * @param accountId {number} ID de la cuenta a bloquear.
 * @param lockedUntil {Date} Fecha/Hora de liberación del bloqueo.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function lockAccountUntil(accountId: number, lockedUntil: Date): Promise<void> {
  const query = `
    UPDATE accounts
    SET
      locked_until = $2,
      updated_at = NOW()
    WHERE account_id = $1
  `;

  await pool.query(query, [accountId, lockedUntil]);
}

<<<<<<< HEAD
/**
 * Descripción: Modifica el estado global de la cuenta (ej. activo, suspendido, pendiente).
 * @param accountId {number} ID del usuario.
 * @param status {string} Nuevo estado.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function updateAccountStatus(accountId: number, status: string): Promise<void> {
  const query = `
    UPDATE accounts
    SET
      account_status = $2,
      updated_at = NOW()
    WHERE account_id = $1
  `;

  await pool.query(query, [accountId, status]);
}

<<<<<<< HEAD
/**
 * Descripción: Registra la fecha y hora exacta del último inicio de sesión exitoso.
 * @param accountId {number} ID del usuario.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function updateLastLoginAt(accountId: number): Promise<void> {
  const query = `
    UPDATE accounts
    SET
      last_login_at = NOW(),
      updated_at = NOW()
    WHERE account_id = $1
  `;

  await pool.query(query, [accountId]);
}

<<<<<<< HEAD
/**
 * Descripción: Aumenta el registro de intentos fallidos al ingresar un OTP.
 * @param verificationCodeId {number} ID interno del código OTP.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function incrementVerificationAttempts(verificationCodeId: number): Promise<void> {
  const query = `
    UPDATE verification_codes
    SET attempts_count = attempts_count + 1
    WHERE verification_code_id = $1
  `;

  await pool.query(query, [verificationCodeId]);
}

<<<<<<< HEAD
/**
 * Descripción: Invalida un código OTP marcándolo como utilizado.
 * POR QUÉ: Soft-delete funcional. Guardar el `consumed_at` permite a soporte técnico verificar a qué hora exacta el usuario completó su verificación.
 * @param verificationCodeId {number} ID interno del código OTP.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function consumeVerificationCode(verificationCodeId: number): Promise<void> {
  const query = `
    UPDATE verification_codes
    SET consumed_at = NOW()
    WHERE verification_code_id = $1
  `;

  await pool.query(query, [verificationCodeId]);
}

<<<<<<< HEAD
/**
 * Descripción: Completa el ciclo de registro de un usuario nuevo marcándolo como verificado y activo.
 * @param accountId {number} ID del usuario.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function activateAccount(accountId: number): Promise<void> {
  const query = `
    UPDATE accounts
    SET
      email_verified = TRUE,
      account_status = 'active',
      registration_completed_at = NOW(),
      updated_at = NOW()
    WHERE account_id = $1
  `;

  await pool.query(query, [accountId]);
}

<<<<<<< HEAD
/**
 * Descripción: Crea un registro de sesión (Refresh Token) en la base de datos.
 * POR QUÉ: Captura metadatos del dispositivo e IP para construir en el futuro un panel de "Dispositivos Activos" para el usuario.
 * @param input {CreateAuthSessionInput} Datos del token y metadatos de conexión.
 * @return {Promise<AuthSession>} Registro de sesión inicializado.
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function createAuthSession(input: CreateAuthSessionInput): Promise<AuthSession> {
  const query = `
    INSERT INTO auth_sessions (
      account_id,
      current_refresh_token_id,
      refresh_token_hash,
      ip_address,
      user_agent,
      device_id,
      device_name,
      session_type,
      is_revoked,
      expires_at,
      last_used_at,
      last_rotated_at,
      created_at,
      updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      FALSE, $9, NOW(), NOW(), NOW(), NOW()
    )
    RETURNING
      session_id,
      account_id,
      current_refresh_token_id,
      refresh_token_hash,
      is_revoked,
      expires_at,
      last_used_at,
      last_rotated_at,
      created_at,
      updated_at
  `;

  const values = [
    input.accountId,
    input.currentRefreshTokenId,
    input.refreshTokenHash,
    input.ipAddress ?? null,
    input.userAgent ?? null,
    input.deviceId ?? null,
    input.deviceName ?? null,
    input.sessionType ?? "web",
    input.expiresAt,
  ];

  const { rows } = await pool.query<AuthSession>(query, values);
  return rows[0];
}

<<<<<<< HEAD
/**
 * Descripción: Busca una sesión por su ID evaluando su estado de revocación.
 * @param sessionId {number | string} ID de la sesión.
 * @return {Promise<AuthSession | null>} Registro de la sesión.
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function findAuthSessionById(sessionId: number | string): Promise<AuthSession | null> {
  const query = `
    SELECT
      session_id,
      account_id,
      current_refresh_token_id,
      refresh_token_hash,
      is_revoked,
      revoked_at,
      revocation_reason,
      expires_at,
      last_used_at,
      last_rotated_at,
      created_at,
      updated_at
    FROM auth_sessions
    WHERE session_id = $1
    LIMIT 1
  `;

  const { rows } = await pool.query<AuthSession>(query, [sessionId]);
  return rows[0] ?? null;
}

<<<<<<< HEAD
/**
 * Descripción: Marca explícitamente una sesión como finalizada/inválida.
 * POR QUÉ: Se exige un `reason` descriptivo ("logout", "refresh_token_reuse", etc.) para clasificar estadísticamente por qué mueren las sesiones en el sistema y detectar patrones anómalos.
 * @param sessionId {number | string} ID de la sesión.
 * @param reason {string} Motivo de la revocación (Por defecto: logout).
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function revokeAuthSession(
  sessionId: number | string,
  reason = "logout"
): Promise<void> {
  const query = `
    UPDATE auth_sessions
    SET
      is_revoked = TRUE,
      revoked_at = NOW(),
      revocation_reason = $2,
      updated_at = NOW()
    WHERE session_id = $1
  `;

  await pool.query(query, [sessionId, reason]);
}

<<<<<<< HEAD
/**
 * Descripción: Actualiza el timestamp de última actividad de una sesión.
 * @param sessionId {number} ID de la sesión.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function updateAuthSessionLastUsed(sessionId: number): Promise<void> {
  const query = `
    UPDATE auth_sessions
    SET
      last_used_at = NOW(),
      updated_at = NOW()
    WHERE session_id = $1
  `;

  await pool.query(query, [sessionId]);
}

<<<<<<< HEAD
/**
 * Descripción: Busca un usuario junto con sus permisos a partir de su ID.
 * POR QUÉ: Similar a `findAccountLoginByEmail`, pero optimizado por Primary Key. Es utilizado en el flujo de Refresh Token para reconstruir la matriz de permisos del Access Token basándose en el estado *actual* de la BD, asegurando que si a un usuario se le quitan permisos, estos se reflejen de inmediato al refrescar.
 * @param accountId {number | string} ID del usuario.
 * @return {Promise<LoginAccount | null>} Cuenta con array de permisos actualizado.
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function findAccountByIdForSession(accountId: number | string): Promise<LoginAccount | null> {
  const query = `
    SELECT
      a.account_id,
      a.username,
      a.email,
      a.password_hash,
      a.full_name,
      a.account_status,
      a.email_verified,
      a.failed_login_count,
      a.locked_until,
      r.code AS role_code,
      COALESCE(
        json_agg(p.code) FILTER (WHERE p.code IS NOT NULL), 
        '[]'
      ) AS permissions
    FROM accounts a
    JOIN roles r ON a.role_id = r.role_id
    LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
    LEFT JOIN permissions p ON rp.permission_id = p.permission_id AND p.is_active = TRUE
    WHERE a.account_id = $1
    GROUP BY 
      a.account_id,
      r.role_id,
      r.code
    LIMIT 1
  `;

  const { rows } = await pool.query<LoginAccount>(query, [accountId]);
  return rows[0] ?? null;
}

<<<<<<< HEAD
/**
 * Descripción: Reemplaza atómicamente el Refresh Token actual de una sesión por uno nuevo (Rotation).
 * @param sessionId {number} ID de la sesión.
 * @param currentRefreshTokenId {string} ID (JTI) del nuevo token.
 * @param refreshTokenHash {string} Hash criptográfico del nuevo token.
 * @param expiresAt {Date} Nueva fecha de caducidad proyectada.
 * @return {Promise<AuthSession | null>} La sesión actualizada.
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function rotateAuthSessionRefreshToken(
  sessionId: number,
  currentRefreshTokenId: string,
  refreshTokenHash: string,
  expiresAt: Date
): Promise<AuthSession | null> {
  const query = `
    UPDATE auth_sessions
    SET
      current_refresh_token_id = $2,
      refresh_token_hash = $3,
      expires_at = $4,
      last_rotated_at = NOW(),
      updated_at = NOW()
    WHERE session_id = $1
    RETURNING
      session_id,
      account_id,
      current_refresh_token_id,
      refresh_token_hash,
      expires_at,
      is_revoked,
      last_rotated_at,
      updated_at
  `;

  const { rows } = await pool.query<AuthSession>(query, [
    sessionId,
    currentRefreshTokenId,
    refreshTokenHash,
    expiresAt,
  ]);

  return rows[0] ?? null;
}

<<<<<<< HEAD
/**
 * Descripción: Invalida de golpe todas las sesiones activas de un usuario.
 * POR QUÉ: Método de contingencia crítica. Se utiliza obligatoriamente cuando hay un cambio de contraseña o una sospecha de brecha de seguridad para expulsar al usuario de todos sus dispositivos conectados instantáneamente.
 * @param accountId {number} ID del usuario.
 * @param reason {string} Motivo del reseteo masivo de sesiones.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function revokeAllActiveSessionsByAccountId(
  accountId: number,
  reason = "new_login"
): Promise<void> {
  const query = `
    UPDATE auth_sessions
    SET
      is_revoked = TRUE,
      revoked_at = NOW(),
      revocation_reason = $2,
      updated_at = NOW()
    WHERE account_id = $1
      AND is_revoked = FALSE
  `;

  await pool.query(query, [accountId, reason]);
}

<<<<<<< HEAD
/**
 * Descripción: Anula todos los códigos OTP de un tipo específico que estén vigentes para un usuario.
 * POR QUÉ: Previene la acumulación de códigos válidos paralelos en la bandeja de entrada del usuario, asegurando que solo el último código generado sea utilizable.
 * @param accountId {number} ID de usuario.
 * @param codeType {string} Flujo del código a limpiar.
 * @param reason {string} Motivo de la invalidación.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function invalidateActiveVerificationCodes(
  accountId: number,
  codeType: "register_email" | "account_reverification",
  reason: string
): Promise<void> {
  const query = `
    UPDATE verification_codes
    SET
      invalidated_at = NOW(),
      invalidation_reason = $3
    WHERE account_id = $1
      AND code_type = $2
      AND consumed_at IS NULL
      AND invalidated_at IS NULL
  `;
  await pool.query(query, [accountId, codeType, reason]);
}

<<<<<<< HEAD
/**
 * Descripción: Actualiza un registro OTP existente para extender su vigencia por un reenvío.
 * @param verificationCodeId {number} ID del registro OTP.
 * @param expiresAt {Date} Nueva fecha de expiración.
 * @param codeHash {string} Hash del código reenviado (puede ser igual o nuevo).
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function markVerificationCodeResent(
  verificationCodeId: number,
  expiresAt: Date,
  codeHash: string
): Promise<void> {
  const query = `
    UPDATE verification_codes
    SET
      code_hash = $2,
      expires_at = $3,
      resend_count = resend_count + 1,
      last_sent_at = NOW()
    WHERE verification_code_id = $1
  `;
  await pool.query(query, [verificationCodeId, codeHash, expiresAt]);
}

<<<<<<< HEAD
/**
 * Descripción: Congela temporalmente la posibilidad de verificar un código específico por exceso de intentos.
 * @param verificationCodeId {number} ID del OTP.
 * @param blockedUntil {Date} Marca de tiempo de liberación.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function blockVerificationCodeUntil(
  verificationCodeId: number,
  blockedUntil: Date
): Promise<void> {
  const query = `
    UPDATE verification_codes
    SET blocked_until = $2
    WHERE verification_code_id = $1
  `;
  await pool.query(query, [verificationCodeId, blockedUntil]);
}

<<<<<<< HEAD
/**
 * Descripción: Guarda un token seguro específico para el flujo de recuperación de contraseña.
 * POR QUÉ: Se utiliza una tabla separada (`password_reset_tokens`) para aislar este flujo crítico de los OTPs regulares numéricos de 6 dígitos, permitiendo tokens alfanuméricos largos y políticas de caducidad independientes.
 * @param accountId {number} ID del usuario solicitante.
 * @param tokenHash {string} Hash criptográfico de la URL del token.
 * @param expiresAt {Date} Límite de vigencia.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function createPasswordResetToken(
  accountId: number,
  tokenHash: string,
  expiresAt: Date
): Promise<void> {
  const query = `
    INSERT INTO password_reset_tokens (
      account_id, token_hash, expires_at
    ) VALUES (
      $1, $2, $3
    )
  `;
  await pool.query(query, [accountId, tokenHash, expiresAt]);
}

<<<<<<< HEAD
/**
 * Descripción: Busca un código OTP activo comprobando que no esté caducado ni consumido.
 * @param codeHash {string} Hash del código a buscar.
 * @param codeType {string} Contexto del código esperado.
 * @return {Promise<VerificationCodeRecord | null>} Registro OTP si es válido.
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function findValidVerificationCodeByHash(
  codeHash: string,
  codeType: string
): Promise<VerificationCodeRecord | null> {
  const query = `
    SELECT * FROM verification_codes
    WHERE code_hash = $1
      AND code_type = $2
      AND consumed_at IS NULL
      AND invalidated_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  `;
  const { rows } = await pool.query<VerificationCodeRecord>(query, [codeHash, codeType]);
  return rows[0] ?? null;
}

<<<<<<< HEAD
/**
 * Descripción: Sobrescribe el hash de la contraseña de un usuario en la base de datos.
 * @param accountId {number} ID del usuario.
 * @param newPasswordHash {string} Contraseña ya encriptada (bcrypt).
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function updateAccountPassword(
  accountId: number, 
  newPasswordHash: string
): Promise<void> {
  const query = `
    UPDATE accounts
    SET 
      password_hash = $2, 
      last_password_change_at = NOW(),
      updated_at = NOW()
    WHERE account_id = $1
  `;
  await pool.query(query, [accountId, newPasswordHash]);
}

<<<<<<< HEAD
/**
 * Descripción: Crea un código de desafío para la trampa de revalidación.
 * @param accountId {number} ID del usuario atrapado.
 * @param email {string} Correo de destino.
 * @param codeHash {string} OTP encriptado.
 * @param expiresAt {Date} Caducidad.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function createRevalidationCode(
  accountId: number,
  email: string,
  codeHash: string,
  expiresAt: Date
): Promise<void> {
  const query = `
    INSERT INTO verification_codes (
      account_id, 
      code_type, 
      channel, 
      destination, 
      code_hash, 
      expires_at, 
      attempts_count, 
      max_attempts, 
      resend_count,
      last_sent_at,
      created_at
    ) VALUES (
      $1, 'account_reverification', 'email', $2, $3, $4, 0, 5, 0, NOW(), NOW()
    )
  `;
  await pool.query(query, [accountId, email, codeHash, expiresAt]);
}

<<<<<<< HEAD
/**
 * Descripción: Valida criptográficamente un token de recuperación evaluando su vigencia.
 * @param tokenHash {string} Hash del token recibido desde la URL.
 * @return {Promise<Object>} El ID del token y a qué usuario pertenece si es válido.
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function findValidPasswordResetToken(
  tokenHash: string
): Promise<{ password_reset_token_id: string, account_id: number } | null> {
  const query = `
    SELECT password_reset_token_id, account_id 
    FROM password_reset_tokens
    WHERE token_hash = $1
      AND used_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  `;
  const { rows } = await pool.query<{ password_reset_token_id: string, account_id: number }>(query, [tokenHash]);
  return rows[0] ?? null;
}

<<<<<<< HEAD
/**
 * Descripción: Marca un token de recuperación como utilizado.
 * @param tokenId {string} ID (UUID) de la fila del token.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function consumePasswordResetToken(
  tokenId: string
): Promise<void> {
  const query = `
    UPDATE password_reset_tokens
    SET used_at = NOW()
    WHERE password_reset_token_id = $1
  `;
  await pool.query(query, [tokenId]);
}

<<<<<<< HEAD
/**
 * Descripción: Recupera el catálogo completo de cuentas de usuario para el panel de administración.
 * POR QUÉ: Realiza un JOIN directo con la tabla roles para devolver el texto del rol (`r.code`) y así el frontend no deba mapear manualmente IDs con nombres. Se ordenan de forma descendente para mostrar los más recientes primero.
 * @param {void}
 * @return {Promise<Array>} Lista de objetos mapeados con estructura simplificada.
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function fetchAllUsersFromDb() {
  const query = `
    SELECT 
      a.account_id AS id, 
      a.full_name AS nombre, 
      a.email, 
      a.account_status AS estado, 
      r.code AS rol
    FROM accounts a
    JOIN roles r ON a.role_id = r.role_id
    ORDER BY a.account_id DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
}

<<<<<<< HEAD
/**
 * Descripción: Actualiza el estado administrativo de una cuenta.
 * POR QUÉ: Se omite intencionalmente una consulta `SELECT` previa. En su lugar se utiliza `RETURNING account_id` y se lee la propiedad nativa `rowCount` de `pg-pool` para confirmar al servicio si la actualización tuvo efecto o si el usuario no existía.
 * @param userId {string | number} ID del usuario.
 * @param newStatus {string} Estado nuevo válido.
 * @return {Promise<number>} Cantidad de filas afectadas (0 o 1).
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function updateUserStatusInDb(userId: string | number, newStatus: string) {
  const query = `
    UPDATE accounts 
    SET account_status = $1 
    WHERE account_id = $2 
    RETURNING account_id
  `;
  const { rowCount } = await pool.query(query, [newStatus, userId]);
  return rowCount ?? 0; // Solo devolvemos cuántas filas se afectaron
}

<<<<<<< HEAD
/**
 * Descripción: Recupera el string representativo del rol de un usuario.
 * @param userId {string | number} ID del usuario.
 * @return {Promise<string | null>} Código del rol o null si no existe.
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function getUserRoleCodeById(userId: string | number) {
  const query = `
    SELECT r.code 
    FROM accounts a 
    JOIN roles r ON a.role_id = r.role_id 
    WHERE a.account_id = $1
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows.length > 0 ? rows[0].code : null;
}

<<<<<<< HEAD
/**
 * Descripción: Ejecuta un Hard-Delete de una cuenta en la base de datos.
 * POR QUÉ: Al igual que en la edición, se basa en `rowCount` para confirmar el borrado sin lecturas previas, descargando de trabajo a la base de datos.
 * @param userId {string | number} ID de la cuenta a destruir.
 * @return {Promise<number>} Filas eliminadas.
 * @throws {Ninguna} Las restricciones de clave foránea (FK constraint) pueden lanzar error si el usuario tiene recursos anclados en otras tablas.
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function deleteUserFromDb(userId: string | number) {
  const query = "DELETE FROM accounts WHERE account_id = $1";
  const { rowCount } = await pool.query(query, [userId]);
  return rowCount ?? 0;
}

<<<<<<< HEAD
/**
 * Descripción: Sobrescribe el perfil completo de un usuario con opción a cambiar credenciales.
 * POR QUÉ: Ramifica la consulta SQL basándose en si existe o no `passwordHash`. Esto evita enviar cadenas nulas que romperían la columna en BD o requerir dos métodos separados en el repositorio.
 * @param id {string | number} ID de cuenta.
 * @param fullName {string} Nombre completo.
 * @param email {string} Correo.
 * @param roleId {number} ID numérico de su nuevo rol.
 * @param passwordHash {string} (Opcional) Hash de la nueva clave.
 * @return {Promise<number>} Filas actualizadas (0 o 1).
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function updateUserAdminInDb(id: string | number, fullName: string, email: string, roleId: number, passwordHash?: string) {
  if (passwordHash) {
    const query = `UPDATE accounts SET full_name = $1, email = $2, role_id = $3, password_hash = $4, updated_at = NOW() WHERE account_id = $5 RETURNING account_id`;
    const { rowCount } = await pool.query(query, [fullName, email, roleId, passwordHash, id]);
    return rowCount ?? 0;
  } else {
    const query = `UPDATE accounts SET full_name = $1, email = $2, role_id = $3, updated_at = NOW() WHERE account_id = $4 RETURNING account_id`;
    const { rowCount } = await pool.query(query, [fullName, email, roleId, id]);
    return rowCount ?? 0;
  }
}

<<<<<<< HEAD
/**
 * Descripción: Devuelve el listado base de roles que están habilitados comercialmente en el sistema.
 * @param {void}
 * @return {Promise<Array>} Roles activos con ID y Nombre.
 * @throws {Ninguna}
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function fetchActiveRolesFromDb() {
  const query = `
    SELECT code, name 
    FROM roles 
    WHERE is_active = TRUE 
    ORDER BY role_id ASC
  `;
  const { rows } = await pool.query(query);
  return rows;
}