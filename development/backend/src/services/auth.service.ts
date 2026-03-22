import { createHash, randomBytes } from "crypto";
import { env } from "../config/env";
import { AppError } from "../types/app-error";
import type {
  BasicAccount,
  LoginInput,
  LoginMeta,
  RegisterInput,
  VerifyEmailCodeInput,
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
  findValidVerificationCodeByHash,
  updateAccountPassword,
  createPasswordResetToken,
  findValidPasswordResetToken,
  consumePasswordResetToken,
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

function mapPublicAccount(account: BasicAccount) {
  return {
    account_id: account.account_id,
    username: account.username,
    email: account.email,
    full_name: account.full_name,
    account_status: account.account_status,
    email_verified: account.email_verified,
  };
}

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

export async function loginUser(payload: LoginInput, meta: LoginMeta = {}) {
  const account = await findAccountLoginByEmail(payload.email);

  // OWASP: Anti-Enumeración
  if (!account) {
    throw new AppError("Correo o contraseña incorrectos", 401);
  }

  // 1. Verificar si la cuenta está actualmente bloqueada por tiempo
  if (account.locked_until && new Date(account.locked_until) > new Date()) {
    throw new AppError("Cuenta bloqueada temporalmente por seguridad. Intente más tarde.", 403);
  }

  // 2. Verificar si está atrapado en la "Trampa de Revalidación"
  if (account.account_status === "pending_revalidation") {
    // Aquí el usuario ya intentó loguearse después del castigo, 
    // pero aún no ha puesto el código de 6 dígitos.
    return {
      requiresRevalidation: true,
      email: account.email,
      message: "Debe revalidar su cuenta por seguridad."
    };
  }

  // 3. Validar la contraseña
  const isPasswordValid = await comparePassword(payload.password, account.password_hash);

  if (!isPasswordValid) {
    const currentFails = account.failed_login_count || 0;
    
    // Si este es el intento fallido número 10
    if (currentFails + 1 >= 10) {
      const lockTime = new Date(Date.now() + 60 * 60 * 1000); 
      // 👇 ¡AGREGAMOS ESTO PARA QUE LLEGUE A 10 EN LA BD!
      await incrementFailedLoginAttempts(account.account_id); 
      await lockAccountUntil(account.account_id, lockTime);
      throw new AppError("Demasiados intentos fallidos. Cuenta bloqueada por 1 hora.", 403);
    } else {
      await incrementFailedLoginAttempts(account.account_id);
      throw new AppError("Correo o contraseña incorrectos", 401);
    }
  }

  // 4. ¡Contraseña Correcta! Pero... ¿acaba de salir de un bloqueo temporal?
  if (account.locked_until) {
    // 1. Cambiamos el estado y limpiamos el historial de fallos
    await updateAccountStatus(account.account_id, "pending_revalidation");
    await resetFailedLoginAttempts(account.account_id);
    
    // 2. Invalidamos códigos de revalidación viejos por si acaso
    await invalidateActiveVerificationCodes(account.account_id, "account_reverification", "new_login_after_lockout");

    // 3. Generamos el código de 6 dígitos usando tu utilidad
    const code = generateOtpCode(6);
    const codeHash = hashOtpCode(code);
    
    // 4. Establecemos la caducidad estricta de 5 minutos
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 5. Guardamos en la BD con el tipo 'account_reverification'
    await createRevalidationCode(account.account_id, account.email, codeHash, expiresAt);

    // 6. Enviamos el correo usando tu función existente
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

  // 5. Login normal y exitoso
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

export async function verifyEmailCode(payload: VerifyEmailCodeInput) {
  const account = await findAccountBasicByEmail(payload.email);

  if (!account) {
    throw new AppError("No existe una cuenta asociada a ese correo", 404);
  }

  // 👇 1. Detectar si viene por Registro Nuevo o por Trampa de Bloqueo
  let codeType: "register_email" | "account_reverification" = "register_email";
  
  if (account.account_status === "pending_revalidation") {
    codeType = "account_reverification";
  } else if (account.email_verified && account.account_status === "active") {
    return {
      valid: true,
      message: "La cuenta ya estaba verificada o activa",
    };
  }

  // 👇 2. Buscar el código correcto usando el codeType dinámico
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

  // 👇 3. Quemar el código y restaurar la cuenta según de dónde venía
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

export async function logoutUser(sessionId: number) {
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

export async function requestPasswordReset(email: string) {
  const account = await findAccountBasicByEmail(email);

  if (!account) {
    return { message: "Si el correo está registrado, se enviará un enlace de recuperación." };
  }

  const resetToken = generateSecureToken();
  const tokenHash = hashSecureToken(resetToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // 👇 Ahora guarda en tu nueva tabla exclusiva (ya no le pasamos el email)
  await createPasswordResetToken(account.account_id, tokenHash, expiresAt);

  const resetLink = `${env.FRONTEND_ORIGIN}/reset-password?token=${resetToken}`;
  
  try {
    await sendPasswordResetEmail(account.email, resetLink);
  } catch (error) {
    console.error("Error al enviar el correo de recuperación:", error);
  }

  return { message: "Si el correo está registrado, se enviará un enlace de recuperación." };
}

export async function executePasswordReset(token: string, newPassword: string) {
  const tokenHash = hashSecureToken(token);

  // 👇 Ahora busca exclusivamente en la tabla password_reset_tokens
  const record = await findValidPasswordResetToken(tokenHash);

  if (!record) {
    throw new AppError("El enlace de recuperación es inválido o ha expirado.", 400);
  }

  const newPasswordHash = await hashPassword(newPassword);

  await updateAccountPassword(record.account_id, newPasswordHash);

  // 👇 Quema el token marcando used_at = NOW()
  await consumePasswordResetToken(record.password_reset_token_id);

  await revokeAllActiveSessionsByAccountId(record.account_id, "password_reset");

  return { message: "Contraseña actualizada con éxito." };
}