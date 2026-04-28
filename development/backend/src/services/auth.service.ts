/**
 * ============================================================================
 * MÓDULO: Servicio de Autenticación (auth.service.ts)
 * * PROPÓSITO: Centraliza la lógica de negocio para la identidad del usuario, 
 * el ciclo de vida de las sesiones y la gestión de credenciales.
 * * RESPONSABILIDAD: Funciona como el orquestador de seguridad entre los 
 * controladores HTTP y la base de datos, garantizando que ninguna acción 
 * comprometa la integridad de las cuentas.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Anti-enumeración: Las funciones de login y recuperación devuelven mensajes 
 * genéricos para no revelar a un atacante si un correo existe o no en la BD.
 * - Rotación de Sesiones: Se utiliza la técnica "Refresh Token Rotation" con 
 * hashes SHA-256 en la base de datos. Si la BD se filtra, los tokens reales 
 * no quedan expuestos.
 * - Bloqueos (Rate Limiting): Delegado a nivel de base de datos mediante 
 * timestamps (locked_until, blocked_until) para evitar el uso de memoria 
 * volátil (como Redis) en esta etapa del proyecto.
 * ============================================================================
 */
import { createHash, randomBytes } from "crypto";
import { env } from "../config/env";
import { AppError } from "../types/app-error";
import type {
  BasicAccount,
  LoginInput,
  LoginMeta,
  RegisterInput,
  VerifyEmailCodeInput,
  PublicAccount,
} from "../types/auth";
import {
  activateAccount,
  blockVerificationCodeUntil,
  createAccount,
  createAuthSession,
  createVerificationCode,
  findAccountBasicByEmail,
  findAccountByEmail,
  findAccountByIdForSession,
  findAccountByUsername,
  findAccountLoginByEmail,
  findAuthSessionById,
  findLatestVerificationCodeByAccountId,
  incrementVerificationAttempts,
  consumeVerificationCode,
  invalidateActiveVerificationCodes,
  revokeAuthSession,
  rotateAuthSessionRefreshToken,
  revokeAllActiveSessionsByAccountId,
  findRoleIdByCode,
  incrementFailedLoginAttempts,
  resetFailedLoginAttempts,
  lockAccountUntil,
  updateAccountStatus,
  updateLastLoginAt,
  updateAuthSessionLastUsed,
  createRevalidationCode,
  updateAccountPassword,
  createPasswordResetToken,
  findValidPasswordResetToken,
  consumePasswordResetToken,
  fetchAllUsersFromDb, 
  updateUserStatusInDb, 
  getUserRoleCodeById, 
  deleteUserFromDb,
  updateUserAdminInDb,
  fetchActiveRolesFromDb,
  adminCreateUserInDb,
  fetchUsersByInstitutionIdFromDb,
  unlinkUserFromInstitutionInDb
} from "../repositories/auth.repository";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/mailer";
import { generateOtpCode, hashOtpCode } from "../utils/otp";
import { comparePassword, hashPassword } from "../utils/password";
import { generateSecureToken, hashSecureToken } from "../utils/token";

function usernameFromEmail(email: string): string {
  return email.split("@")[0].trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");

  if (!local || !domain) {
    return email;
  }

  if (local.length <= 2) {
    return `${local[0] ?? "*"}*@${domain}`;
  }

  return `${local.slice(0, 2)}***@${domain}`;
}

async function buildUniqueUsername(baseUsername: string): Promise<string> {
  const normalizedBase = baseUsername || `user${Date.now()}`;

  let candidate = normalizedBase;
  let counter = 1;

  while (true) {
    const existing = await findAccountByUsername(candidate);

    if (!existing) {
      return candidate;
    }

    candidate = `${normalizedBase}${counter}`;
    counter += 1;
  }
}


/**
 * Descripción: Formatea la entidad de la base de datos para exponer solo los datos seguros al frontend.
 * POR QUÉ: Evita la filtración accidental de hashes de contraseñas, tokens de recuperación o estados internos en las respuestas HTTP.
 * @param account {any} Objeto crudo del usuario proveniente de la base de datos.
 * @return {PublicAccount} Objeto sanitizado sin datos sensibles.
 * @throws {Ninguna}
 */
export function mapPublicAccount(account: any): PublicAccount {
  return {
    account_id: account.account_id,
    username: account.username,         
    email: account.email,
    full_name: account.full_name,
    account_status: account.account_status, 
    email_verified: account.email_verified, 
    institution_id: account.institution_id,
    role: account.role_code || "registered_user",
    permissions: account.permissions || []
  };
}

/**
 * Descripción: Crea una nueva cuenta de usuario y emite el primer código de verificación.
 * POR QUÉ: Invalida proactivamente cualquier código previo asociado a este flujo (ej. si el usuario hace doble clic en "Registrar") para prevenir condiciones de carrera (Race Conditions) y acumulación de basura en la tabla de OTPs.
 * @param payload {RegisterInput} Datos del formulario de registro.
 * @return {Promise<Object>} Confirmación de creación, cuenta pública y meta de verificación.
 * @throws {AppError} 409 Si el correo ya existe. 500 Si no se encuentra el rol base.
 */
export async function registerUser(payload: RegisterInput) {
  const existing = await findAccountByEmail(payload.email);

  if (existing) {
    throw new AppError("El correo ya está registrado", 409);
  }

  const registeredUserRoleId = await findRoleIdByCode("registered_user");

  if (!registeredUserRoleId) {
    throw new AppError("No existe el rol base registered_user", 500);
  }

  const baseUsername = usernameFromEmail(payload.email);
  const username = await buildUniqueUsername(baseUsername);
  const passwordHash = await hashPassword(payload.password);

  const account = await createAccount({
    roleId: registeredUserRoleId,
    username,
    email: payload.email,
    passwordHash,
    fullName: payload.name,
    accountStatus: "pending_verification",
  });

  await invalidateActiveVerificationCodes(
    account.account_id,
    "register_email",
    "new_code_issued"
  );

  const code = generateOtpCode(6);
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const verification = await createVerificationCode({
    accountId: account.account_id,
    codeHash,
    destination: payload.email,
    destinationMasked: maskEmail(payload.email),
    expiresAt,
  });

  await sendVerificationEmail(payload.email, code);

  return {
    message: "Cuenta creada. Revisa tu correo para verificarla.",
    account: mapPublicAccount(account),
    verification,
  };
}

/**
 * Descripción: Autentica al usuario verificando credenciales, gestionando bloqueos por fuerza bruta y creando la sesión.
 * POR QUÉ: Implementa un flujo atípico llamado "Trampa de Revalidación": Si un usuario acaba de salir de un bloqueo por fuerza bruta (locked_until), se asume que la contraseña pudo ser comprometida. El sistema lo atrapa en estado 'pending_revalidation' y lo obliga a pasar un reto de 2FA (OTP al correo) antes de emitir los JWT.
 * @param payload {LoginInput} Credenciales del usuario.
 * @param meta {LoginMeta} Metadatos (IP, User-Agent) para la creación de la sesión de auditoría.
 * @return {Promise<Object>} Los tokens JWT o una bandera de `requiresRevalidation`.
 * @throws {AppError} 401 si las credenciales fallan, 403 si la cuenta está bloqueada temporalmente.
 */
export async function loginUser(payload: LoginInput, meta: LoginMeta = {}) {
  const account = await findAccountLoginByEmail(payload.email);

  if (!account) {
    throw new AppError("Correo o contraseña incorrectos", 401);
  }

  if (account.locked_until && new Date(account.locked_until) > new Date()) {
    throw new AppError("Cuenta bloqueada temporalmente por seguridad. Intente más tarde.", 403);
  }

  if (account.account_status === "pending_revalidation") {
    return {
      requiresRevalidation: true,
      email: account.email,
      message: "Debe revalidar su cuenta por seguridad."
    };
  }

  const isPasswordValid = await comparePassword(payload.password, account.password_hash);

  if (!isPasswordValid) {
    const currentFails = account.failed_login_count || 0;
    
    if (currentFails + 1 >= 10) {
      const lockTime = new Date(Date.now() + 60 * 60 * 1000); 
      await incrementFailedLoginAttempts(account.account_id); 
      await lockAccountUntil(account.account_id, lockTime);
      throw new AppError("Demasiados intentos fallidos. Cuenta bloqueada por 1 hora.", 403);
    } else {
      await incrementFailedLoginAttempts(account.account_id);
      throw new AppError("Correo o contraseña incorrectos", 401);
    }
  }

  if (account.locked_until) {
    await updateAccountStatus(account.account_id, "pending_revalidation");
    await resetFailedLoginAttempts(account.account_id);
    
    await invalidateActiveVerificationCodes(account.account_id, "account_reverification", "new_login_after_lockout");

    const code = generateOtpCode(6);
    const codeHash = hashOtpCode(code);
    
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await createRevalidationCode(account.account_id, account.email, codeHash, expiresAt);

    try {
      await sendVerificationEmail(account.email, code);
    } catch (error) {
      console.error("Error al enviar código de revalidación:", error);
    }

    return {
      requiresRevalidation: true,
      email: account.email,
      message: "Por seguridad, hemos enviado un código a su correo para revalidar su cuenta."
    };
  }

  await resetFailedLoginAttempts(account.account_id); 
  
  if (account.account_status !== "active" || !account.email_verified) {
    throw new AppError("Debe verificar su correo para iniciar sesión", 403);
  }

  await resetFailedLoginAttempts(account.account_id);
  await updateLastLoginAt(account.account_id);

  const refreshExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_IN_MS);

  await revokeAllActiveSessionsByAccountId(account.account_id, "new_login");

  const refreshTokenId = randomBytes(16).toString("hex");

  const session = await createAuthSession({
    accountId: account.account_id,
    currentRefreshTokenId: refreshTokenId,
    refreshTokenHash: "",
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    deviceId: null,
    deviceName: "Web Browser",
    sessionType: "web",
    expiresAt: refreshExpiresAt,
  });

  const refreshToken = signRefreshToken({
    sub: account.account_id,
    email: account.email,
    sessionId: session.session_id,
    tokenId: refreshTokenId,
  });

  const refreshTokenHash = createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await rotateAuthSessionRefreshToken(
    session.session_id,
    refreshTokenId,
    refreshTokenHash,
    refreshExpiresAt
  );

  const accessExpiresAt = new Date(Date.now() + env.ACCESS_TOKEN_EXPIRES_IN_MS);

  const accessToken = signAccessToken({
    sub: account.account_id,
    email: account.email,
    sessionId: session.session_id,
    permissions: account.permissions || [], 
    role: account.role_code || "registered_user",
    institution_id: account.institution_id || null
  });

  return {
    message: "Login exitoso",
    accessToken,
    refreshToken,
    account: mapPublicAccount(account),
    accessExpiresAt,
    refreshExpiresAt,
  };
}

/**
 * Descripción: Valida los OTP (One-Time Passwords) enviados al correo.
 * POR QUÉ: Utiliza resolución dinámica del tipo de código (`codeType`) basándose en el estado de la cuenta. Esto permite usar el mismo endpoint y tabla de la BD tanto para "Nuevos Registros" como para "Cuentas Atrapadas tras Bloqueo". Adicionalmente bloquea el código temporalmente si hay intentos fallidos para prevenir fuerza bruta.
 * @param payload {VerifyEmailCodeInput} Email del usuario y el código de 6 dígitos.
 * @return {Promise<Object>} Confirmación de éxito.
 * @throws {AppError} 400 si el código es incorrecto o expirado, 429 si se exceden los intentos.
 */
export async function verifyEmailCode(payload: VerifyEmailCodeInput) {
  const account = await findAccountBasicByEmail(payload.email);

  if (!account) {
    throw new AppError("No existe una cuenta asociada a ese correo", 404);
  }

  let codeType: "register_email" | "account_reverification" = "register_email";
  
  if (account.account_status === "pending_revalidation") {
    codeType = "account_reverification";
  } else if (account.email_verified && account.account_status === "active") {
    return {
      valid: true,
      message: "La cuenta ya estaba verificada o activa",
    };
  }

  const verificationCode = await findLatestVerificationCodeByAccountId(
    account.account_id,
    codeType
  );

  if (!verificationCode) {
    throw new AppError("No existe un código de verificación para esta cuenta", 404);
  }

  if (verificationCode.consumed_at) {
    throw new AppError("Este código ya fue utilizado", 400);
  }

  if (verificationCode.invalidated_at) {
    throw new AppError("El código ya no es válido", 400);
  }

  const now = new Date();

  if (verificationCode.blocked_until && new Date(verificationCode.blocked_until) > now) {
    throw new AppError("Debes esperar antes de volver a intentar", 429);
  }

  const expiresAt = new Date(verificationCode.expires_at);

  if (expiresAt < now) {
    throw new AppError("El código ha expirado", 400);
  }

  if (verificationCode.attempts_count >= verificationCode.max_attempts) {
    const blockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    await blockVerificationCodeUntil(
      verificationCode.verification_code_id,
      blockedUntil
    );
    throw new AppError("Se alcanzó el máximo de intentos para este código", 429);
  }

  const inputCodeHash = hashOtpCode(payload.codigo);

  if (inputCodeHash !== verificationCode.code_hash) {
    await incrementVerificationAttempts(verificationCode.verification_code_id);

    const nextAttempts = verificationCode.attempts_count + 1;

    if (nextAttempts >= verificationCode.max_attempts) {
      const blockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      await blockVerificationCodeUntil(
        verificationCode.verification_code_id,
        blockedUntil
      );
    }

    throw new AppError("El código ingresado es incorrecto", 400);
  }

  await consumeVerificationCode(verificationCode.verification_code_id);
  
  if (codeType === "account_reverification") {
    await updateAccountStatus(account.account_id, "active");
  } else {
    await activateAccount(account.account_id);
  }

  return {
    valid: true,
    message: codeType === "account_reverification" 
      ? "Cuenta revalidada y desbloqueada con éxito" 
      : "Cuenta verificada correctamente",
  };
}

/**
 * Descripción: Revoca una sesión activa.
 * POR QUÉ: No elimina el registro de la tabla (Soft-delete/Revoke) para mantener una traza de auditoría de las sesiones históricas.
 * @param sessionId {number | string} ID de la sesión en BD extraído del JWT.
 * @return {Promise<Object>} Confirmación de cierre.
 * @throws {AppError} 404 si la sesión no existe.
 */
export async function logoutUser(sessionId: number | string) {
  const session = await findAuthSessionById(sessionId);

  if (!session) {
    throw new AppError("Sesión no encontrada", 404);
  }

  if (!session.is_revoked) {
    await revokeAuthSession(sessionId, "logout");
  }

  return {
    message: "Sesión cerrada correctamente",
  };
}

/**
 * Descripción: Emite un nuevo Access Token y rota el Refresh Token existente.
 * POR QUÉ: Implementa validación criptográfica del `refresh_token_hash`. Si un atacante intercepta un Refresh Token y lo usa, el servidor detectará que el hash no coincide con el último emitido (Token Reuse Detection) y revocará la sesión inmediatamente por seguridad.
 * @param refreshToken {string} El token seguro almacenado en las cookies.
 * @param meta {LoginMeta} Metadatos para actualizar el último uso de la sesión.
 * @return {Promise<Object>} Nuevos Access y Refresh tokens.
 * @throws {AppError} 401 si se detecta reutilización o si la firma es inválida.
 */
export async function refreshUserSession(refreshToken: string, meta: LoginMeta = {}) {
  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    // ESTO NOS DIRÁ LA VERDAD ABSOLUTA
    console.error("🚨 FALLO REAL AL VERIFICAR EL JWT:", error); 
    throw new AppError("Refresh token inválido o expirado", 401);
  }

  const currentSession = await findAuthSessionById(decoded.sessionId);

  if (!currentSession) {
    throw new AppError("Sesión no encontrada", 401);
  }

  if (currentSession.is_revoked) {
    throw new AppError("La sesión fue revocada", 401);
  }

  const now = new Date();

  if (new Date(currentSession.expires_at) <= now) {
    await revokeAuthSession(currentSession.session_id, "refresh_token_expired");
    throw new AppError("La sesión ha expirado", 401);
  }

  if (decoded.tokenId !== currentSession.current_refresh_token_id) {
    await revokeAuthSession(currentSession.session_id, "refresh_token_id_mismatch");
    throw new AppError("Refresh token inválido", 401);
  }

  const incomingRefreshTokenHash = createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  if (currentSession.refresh_token_hash !== incomingRefreshTokenHash) {
    await revokeAuthSession(currentSession.session_id, "refresh_token_reuse_detected");
    throw new AppError("Se detectó reutilización de refresh token", 401);
  }

  const account = await findAccountByIdForSession(currentSession.account_id);

  if (!account) {
    await revokeAuthSession(currentSession.session_id, "account_not_found_on_refresh");
    throw new AppError("Cuenta no encontrada", 404);
  }

  if (!account.email_verified || account.account_status !== "active") {
    await revokeAuthSession(currentSession.session_id, "account_not_active_on_refresh");
    throw new AppError("La cuenta no está habilitada", 403);
  }

  const newRefreshExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_IN_MS);

  const nextRefreshTokenId = randomBytes(16).toString("hex");

  const nextRefreshToken = signRefreshToken({
    sub: account.account_id,
    email: account.email,
    sessionId: currentSession.session_id,
    tokenId: nextRefreshTokenId,
  });

  const nextRefreshTokenHash = createHash("sha256")
    .update(nextRefreshToken)
    .digest("hex");

  await rotateAuthSessionRefreshToken(
    currentSession.session_id,
    nextRefreshTokenId,
    nextRefreshTokenHash,
    newRefreshExpiresAt
  );

  await updateAuthSessionLastUsed(currentSession.session_id);

  const accessExpiresAt = new Date(Date.now() + env.ACCESS_TOKEN_EXPIRES_IN_MS);

  const accessToken = signAccessToken({
    sub: account.account_id,
    email: account.email,
    sessionId: currentSession.session_id,
    permissions: account.permissions || [], 
    role: account.role_code || "registered_user",
    institution_id: account.institution_id || null
  });

  return {
    message: "Sesión renovada correctamente",
    accessToken,
    refreshToken: nextRefreshToken,
    account: mapPublicAccount(account),
    accessExpiresAt,
    refreshExpiresAt: newRefreshExpiresAt,
  };
}

/**
 * Descripción: Emite un nuevo OTP de verificación y lo envía al correo.
 * POR QUÉ: Devuelve un éxito ficticio ("Si el correo existe...") incluso si la cuenta no se encuentra, previniendo enumeración de correos. Exige un "cooldown" de 60 segundos por diseño para mitigar ataques de Spam o agotamiento de cuota en el proveedor de emails.
 * @param email {string} Correo al que se enviará el código.
 * @return {Promise<Object>} Mensaje de confirmación genérico.
 * @throws {AppError} 429 Si no han pasado 60 segundos o si se supera el límite de 3 reenvíos.
 */
export async function resendVerificationCode(email: string) {
  const account = await findAccountBasicByEmail(email);

  if (!account) {
    return {
      message: "Si el correo existe, se enviará un nuevo código de verificación.",
    };
  }

  if (account.email_verified && account.account_status === "active") {
    return {
      message: "Si el correo existe, se enviará un nuevo código de verificación.",
    };
  }

  const latest = await findLatestVerificationCodeByAccountId(
    account.account_id,
    "register_email"
  );

  const now = new Date();

  if (latest?.blocked_until && new Date(latest.blocked_until) > now) {
    throw new AppError("Debes esperar antes de solicitar otro código", 429);
  }

  if (latest?.last_sent_at) {
    const secondsSinceLastSend =
      (Date.now() - new Date(latest.last_sent_at).getTime()) / 1000;

    if (secondsSinceLastSend < 60) {
      throw new AppError(
        "Espera al menos 60 segundos antes de reenviar el código",
        429
      );
    }
  }

  if ((latest?.resend_count ?? 0) >= 3) {
    const blockedUntil = new Date(Date.now() + 15 * 60 * 1000);

    if (latest) {
      await blockVerificationCodeUntil(latest.verification_code_id, blockedUntil);
    }

    throw new AppError("Se alcanzó el máximo de reenvíos permitidos", 429);
  }

  await invalidateActiveVerificationCodes(
    account.account_id,
    "register_email",
    "resend_requested"
  );

  const code = generateOtpCode(6);
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await createVerificationCode({
    accountId: account.account_id,
    codeHash,
    destination: account.email,
    destinationMasked: maskEmail(account.email),
    expiresAt,
  });

  await sendVerificationEmail(account.email, code);

  return {
    message: "Si el correo existe, se enviará un nuevo código de verificación.",
  };
}

/**
 * Descripción: Inicia el flujo de recuperación de contraseña generando un token seguro.
 * POR QUÉ: En lugar de guardar el token en texto plano, se almacena un hash (`tokenHash`). Así, si la BD es comprometida, los atacantes no pueden usar los tokens para tomar el control de cuentas. Se emplea protección anti-enumeración devolviendo siempre éxito.
 * @param email {string} Correo del usuario que solicita recuperación.
 * @return {Promise<Object>} Mensaje de éxito genérico.
 * @throws {Ninguna} Errores de envío de mail se loguean internamente para no revelar el fallo.
 */
export async function requestPasswordReset(email: string) {
  const account = await findAccountBasicByEmail(email);

  if (!account) {
    return { message: "Si el correo está registrado, se enviará un enlace de recuperación." };
  }

  const resetToken = generateSecureToken();
  const tokenHash = hashSecureToken(resetToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await createPasswordResetToken(account.account_id, tokenHash, expiresAt);

  const resetLink = `${env.FRONTEND_ORIGIN}/reset-password?token=${resetToken}`;
  
  try {
    await sendPasswordResetEmail(account.email, resetLink);
  } catch (error) {
    console.error("Error al enviar el correo de recuperación:", error);
  }

  return { message: "Si el correo está registrado, se enviará un enlace de recuperación." };
}

/**
 * Descripción: Procesa el token de recuperación y establece la nueva contraseña.
 * POR QUÉ: Al cambiar la contraseña, automáticamente revoca *todas* las sesiones activas (`revokeAllActiveSessionsByAccountId`). Esto garantiza que si la cuenta estaba vulnerada, el intruso sea expulsado de inmediato de cualquier dispositivo.
 * @param token {string} Token crudo recibido desde la URL del correo.
 * @param newPassword {string} La nueva contraseña en texto plano.
 * @return {Promise<Object>} Confirmación de actualización.
 * @throws {AppError} 400 si el token ya expiró, fue usado o no existe.
 */
export async function executePasswordReset(token: string, newPassword: string) {
  const tokenHash = hashSecureToken(token);
  const record = await findValidPasswordResetToken(tokenHash);

  if (!record) {
    throw new AppError("El enlace de recuperación es inválido o ha expirado.", 400);
  }

  const newPasswordHash = await hashPassword(newPassword);

  await updateAccountPassword(record.account_id, newPasswordHash);

  await consumePasswordResetToken(record.password_reset_token_id);

  await revokeAllActiveSessionsByAccountId(record.account_id, "password_reset");

  return { message: "Contraseña actualizada con éxito." };
}


/**
 * Descripción: Recupera la lista completa de usuarios.
 * @return {Promise<Array>} Lista de usuarios.
 * @throws {Ninguna}
 */
export async function getAllUsers() {
  const users = await fetchAllUsersFromDb();
  return users;
}

/**
 * Descripción: Actualiza el estado administrativo de un usuario (ej. suspender, activar).
 * POR QUÉ: Valida los estados permitidos en la capa de servicio, desvinculando esta regla de negocio del controlador o la base de datos subyacente.
 * @param userId {string | number} ID del usuario objetivo.
 * @param newStatus {string} Estado nuevo a aplicar.
 * @return {Promise<Object>} Confirmación de éxito.
 * @throws {AppError} 400 si el estado no es válido, 404 si el usuario no existe.
 */
export async function updateUserStatus(userId: string | number, newStatus: string) {
  const validStatuses = ["active", "suspended", "pending_verification", "pending_revalidation"];
  if (!validStatuses.includes(newStatus)) {
    throw new AppError("Estado de cuenta no válido", 400);
  }

  const affectedRows = await updateUserStatusInDb(userId, newStatus);

  if (affectedRows === 0) {
    throw new AppError("Usuario no encontrado", 404);
  }

  return { message: "Estado actualizado exitosamente" };
}

/**
 * Descripción: Elimina a un usuario del sistema permanentemente.
 * POR QUÉ: Implementa una guardia de seguridad hardcodeada para proteger el rol 'super_admin'. Así se previene el caso crítico donde un administrador borre por accidente (o malicia) la cuenta principal del sistema.
 * @param userId {string | number} ID del usuario a eliminar.
 * @return {Promise<Object>} Confirmación de éxito.
 * @throws {AppError} 403 si se intenta borrar un superadmin, 404 si no existe.
 */
export async function deleteUser(userId: string | number) {
  const roleCode = await getUserRoleCodeById(userId);
  
  if (roleCode === 'super_admin') {
    throw new AppError("Acción denegada: No puedes eliminar a un Super Administrador", 403);
  }

  const affectedRows = await deleteUserFromDb(userId);

  if (affectedRows === 0) {
    throw new AppError("Usuario no encontrado", 404);
  }

  return { message: "Usuario eliminado correctamente" };
}

/**
 * Descripción: Edita el perfil de un usuario desde la perspectiva de un administrador.
 * POR QUÉ: Permite cambiar la contraseña opcionalmente sin pasar por el flujo de recuperación de usuario. Resuelve internamente la conversión del roleCode string a su roleId numérico de BD.
 * @param userId {string | number} ID del usuario a modificar.
 * @param fullName {string} Nombre completo.
 * @param email {string} Correo (podría requerir validación extra de unicidad delegada a la BD).
 * @param roleCode {string} Código del rol a asignar.
 * @param newPassword {string} (Opcional) Nueva contraseña.
 * @return {Promise<Object>} Confirmación de actualización.
 * @throws {AppError} 400 si el rol seleccionado es inválido, 404 si no encuentra al usuario.
 */
export async function editUserAdmin(userId: string | number, fullName: string, email: string, roleCode: string, newPassword?: string, institutionId?: number | null) {
  let newPasswordHash;
  if (newPassword && newPassword.trim() !== "") {
    newPasswordHash = await hashPassword(newPassword);
  }

  const roleId = await findRoleIdByCode(roleCode);
  if (!roleId) throw new AppError("El rol seleccionado no es válido", 400);

  // Inyectamos el institutionId al repositorio
  const affectedRows = await updateUserAdminInDb(userId, fullName, email, roleId, newPasswordHash, institutionId);

  if (affectedRows === 0) throw new AppError("Usuario no encontrado", 404);
  return { message: "Usuario actualizado correctamente" };
}

/**
 * Descripción: Devuelve todos los roles activos disponibles para asignar.
 * @return {Promise<Array>} Lista de roles activos.
 * @throws {Ninguna}
 */
export async function getActiveRoles() {
  const roles = await fetchActiveRolesFromDb();
  return roles;
}

/**
 * Lógica de negocio para la creación administrativa de usuarios.
 */
export async function adminCreateUser(input: any) {
  // 1. Verificar si el usuario o email ya existen
  const existingUser = await findAccountByEmail(input.email);
  if (existingUser) throw new AppError("El correo electrónico ya está registrado", 409);

  // 2. Obtener el ID del rol basado en el código enviado (ej: 'data_admin')
  const roleId = await findRoleIdByCode(input.role_code);
  if (!roleId) throw new AppError("El rol especificado no es válido", 400);

  // 3. Hashear la contraseña
  const passwordHash = await hashPassword(input.password);

  // 4. Persistir
  const newUser = await adminCreateUserInDb({
    ...input,
    role_id: roleId,
    password_hash: passwordHash
  });

  return { 
    message: "Usuario creado y activado exitosamente", 
    user: newUser 
  };
}

export async function getUsersByInstitution(institutionId: number) {
  return await fetchUsersByInstitutionIdFromDb(institutionId);
}

export async function unlinkUser(userId: number, degradeRole: boolean) {
  let roleIdToDowngrade;
  
  if (degradeRole) {
    roleIdToDowngrade = await findRoleIdByCode('registered_user');
    if (!roleIdToDowngrade) throw new AppError("Rol base no encontrado", 500);
  }

  const affectedRows = await unlinkUserFromInstitutionInDb(userId, roleIdToDowngrade);
  if (affectedRows === 0) throw new AppError("Usuario no encontrado", 404);
  
  return { message: degradeRole ? "Usuario desvinculado y degradado a Usuario Registrado." : "Usuario desvinculado correctamente." };
}