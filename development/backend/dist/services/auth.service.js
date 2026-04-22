"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapPublicAccount = mapPublicAccount;
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.verifyEmailCode = verifyEmailCode;
exports.logoutUser = logoutUser;
exports.refreshUserSession = refreshUserSession;
exports.resendVerificationCode = resendVerificationCode;
exports.requestPasswordReset = requestPasswordReset;
exports.executePasswordReset = executePasswordReset;
exports.getAllUsers = getAllUsers;
exports.updateUserStatus = updateUserStatus;
exports.deleteUser = deleteUser;
exports.editUserAdmin = editUserAdmin;
exports.getActiveRoles = getActiveRoles;
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
const crypto_1 = require("crypto");
const env_1 = require("../config/env");
const app_error_1 = require("../types/app-error");
const auth_repository_1 = require("../repositories/auth.repository");
const jwt_1 = require("../utils/jwt");
const mailer_1 = require("../utils/mailer");
const otp_1 = require("../utils/otp");
const password_1 = require("../utils/password");
const token_1 = require("../utils/token");
function usernameFromEmail(email) {
    return email.split("@")[0].trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}
function maskEmail(email) {
    const [local, domain] = email.split("@");
    if (!local || !domain) {
        return email;
    }
    if (local.length <= 2) {
        return `${local[0] ?? "*"}*@${domain}`;
    }
    return `${local.slice(0, 2)}***@${domain}`;
}
async function buildUniqueUsername(baseUsername) {
    const normalizedBase = baseUsername || `user${Date.now()}`;
    let candidate = normalizedBase;
    let counter = 1;
    while (true) {
        const existing = await (0, auth_repository_1.findAccountByUsername)(candidate);
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
function mapPublicAccount(account) {
    return {
        account_id: account.account_id,
        username: account.username,
        email: account.email,
        full_name: account.full_name,
        account_status: account.account_status,
        email_verified: account.email_verified,
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
async function registerUser(payload) {
    const existing = await (0, auth_repository_1.findAccountByEmail)(payload.email);
    if (existing) {
        throw new app_error_1.AppError("El correo ya está registrado", 409);
    }
    const registeredUserRoleId = await (0, auth_repository_1.findRoleIdByCode)("registered_user");
    if (!registeredUserRoleId) {
        throw new app_error_1.AppError("No existe el rol base registered_user", 500);
    }
    const baseUsername = usernameFromEmail(payload.email);
    const username = await buildUniqueUsername(baseUsername);
    const passwordHash = await (0, password_1.hashPassword)(payload.password);
    const account = await (0, auth_repository_1.createAccount)({
        roleId: registeredUserRoleId,
        username,
        email: payload.email,
        passwordHash,
        fullName: payload.name,
        accountStatus: "pending_verification",
    });
    await (0, auth_repository_1.invalidateActiveVerificationCodes)(account.account_id, "register_email", "new_code_issued");
    const code = (0, otp_1.generateOtpCode)(6);
    const codeHash = (0, otp_1.hashOtpCode)(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const verification = await (0, auth_repository_1.createVerificationCode)({
        accountId: account.account_id,
        codeHash,
        destination: payload.email,
        destinationMasked: maskEmail(payload.email),
        expiresAt,
    });
    await (0, mailer_1.sendVerificationEmail)(payload.email, code);
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
async function loginUser(payload, meta = {}) {
    const account = await (0, auth_repository_1.findAccountLoginByEmail)(payload.email);
    if (!account) {
        throw new app_error_1.AppError("Correo o contraseña incorrectos", 401);
    }
    if (account.locked_until && new Date(account.locked_until) > new Date()) {
        throw new app_error_1.AppError("Cuenta bloqueada temporalmente por seguridad. Intente más tarde.", 403);
    }
    if (account.account_status === "pending_revalidation") {
        return {
            requiresRevalidation: true,
            email: account.email,
            message: "Debe revalidar su cuenta por seguridad."
        };
    }
    const isPasswordValid = await (0, password_1.comparePassword)(payload.password, account.password_hash);
    if (!isPasswordValid) {
        const currentFails = account.failed_login_count || 0;
        if (currentFails + 1 >= 10) {
            const lockTime = new Date(Date.now() + 60 * 60 * 1000);
            await (0, auth_repository_1.incrementFailedLoginAttempts)(account.account_id);
            await (0, auth_repository_1.lockAccountUntil)(account.account_id, lockTime);
            throw new app_error_1.AppError("Demasiados intentos fallidos. Cuenta bloqueada por 1 hora.", 403);
        }
        else {
            await (0, auth_repository_1.incrementFailedLoginAttempts)(account.account_id);
            throw new app_error_1.AppError("Correo o contraseña incorrectos", 401);
        }
    }
    if (account.locked_until) {
        await (0, auth_repository_1.updateAccountStatus)(account.account_id, "pending_revalidation");
        await (0, auth_repository_1.resetFailedLoginAttempts)(account.account_id);
        await (0, auth_repository_1.invalidateActiveVerificationCodes)(account.account_id, "account_reverification", "new_login_after_lockout");
        const code = (0, otp_1.generateOtpCode)(6);
        const codeHash = (0, otp_1.hashOtpCode)(code);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await (0, auth_repository_1.createRevalidationCode)(account.account_id, account.email, codeHash, expiresAt);
        try {
            await (0, mailer_1.sendVerificationEmail)(account.email, code);
        }
        catch (error) {
            console.error("Error al enviar código de revalidación:", error);
        }
        return {
            requiresRevalidation: true,
            email: account.email,
            message: "Por seguridad, hemos enviado un código a su correo para revalidar su cuenta."
        };
    }
    await (0, auth_repository_1.resetFailedLoginAttempts)(account.account_id);
    if (account.account_status !== "active" || !account.email_verified) {
        throw new app_error_1.AppError("Debe verificar su correo para iniciar sesión", 403);
    }
    await (0, auth_repository_1.resetFailedLoginAttempts)(account.account_id);
    await (0, auth_repository_1.updateLastLoginAt)(account.account_id);
    const refreshExpiresAt = new Date(Date.now() + env_1.env.REFRESH_TOKEN_EXPIRES_IN_MS);
    await (0, auth_repository_1.revokeAllActiveSessionsByAccountId)(account.account_id, "new_login");
    const refreshTokenId = (0, crypto_1.randomBytes)(16).toString("hex");
    const session = await (0, auth_repository_1.createAuthSession)({
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
    const refreshToken = (0, jwt_1.signRefreshToken)({
        sub: account.account_id,
        email: account.email,
        sessionId: session.session_id,
        tokenId: refreshTokenId,
    });
    const refreshTokenHash = (0, crypto_1.createHash)("sha256")
        .update(refreshToken)
        .digest("hex");
    await (0, auth_repository_1.rotateAuthSessionRefreshToken)(session.session_id, refreshTokenId, refreshTokenHash, refreshExpiresAt);
    const accessExpiresAt = new Date(Date.now() + env_1.env.ACCESS_TOKEN_EXPIRES_IN_MS);
    const accessToken = (0, jwt_1.signAccessToken)({
        sub: account.account_id,
        email: account.email,
        sessionId: session.session_id,
        permissions: account.permissions || [],
        role: account.role_code || "registered_user"
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
async function verifyEmailCode(payload) {
    const account = await (0, auth_repository_1.findAccountBasicByEmail)(payload.email);
    if (!account) {
        throw new app_error_1.AppError("No existe una cuenta asociada a ese correo", 404);
    }
    let codeType = "register_email";
    if (account.account_status === "pending_revalidation") {
        codeType = "account_reverification";
    }
    else if (account.email_verified && account.account_status === "active") {
        return {
            valid: true,
            message: "La cuenta ya estaba verificada o activa",
        };
    }
    const verificationCode = await (0, auth_repository_1.findLatestVerificationCodeByAccountId)(account.account_id, codeType);
    if (!verificationCode) {
        throw new app_error_1.AppError("No existe un código de verificación para esta cuenta", 404);
    }
    if (verificationCode.consumed_at) {
        throw new app_error_1.AppError("Este código ya fue utilizado", 400);
    }
    if (verificationCode.invalidated_at) {
        throw new app_error_1.AppError("El código ya no es válido", 400);
    }
    const now = new Date();
    if (verificationCode.blocked_until && new Date(verificationCode.blocked_until) > now) {
        throw new app_error_1.AppError("Debes esperar antes de volver a intentar", 429);
    }
    const expiresAt = new Date(verificationCode.expires_at);
    if (expiresAt < now) {
        throw new app_error_1.AppError("El código ha expirado", 400);
    }
    if (verificationCode.attempts_count >= verificationCode.max_attempts) {
        const blockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        await (0, auth_repository_1.blockVerificationCodeUntil)(verificationCode.verification_code_id, blockedUntil);
        throw new app_error_1.AppError("Se alcanzó el máximo de intentos para este código", 429);
    }
    const inputCodeHash = (0, otp_1.hashOtpCode)(payload.codigo);
    if (inputCodeHash !== verificationCode.code_hash) {
        await (0, auth_repository_1.incrementVerificationAttempts)(verificationCode.verification_code_id);
        const nextAttempts = verificationCode.attempts_count + 1;
        if (nextAttempts >= verificationCode.max_attempts) {
            const blockedUntil = new Date(Date.now() + 15 * 60 * 1000);
            await (0, auth_repository_1.blockVerificationCodeUntil)(verificationCode.verification_code_id, blockedUntil);
        }
        throw new app_error_1.AppError("El código ingresado es incorrecto", 400);
    }
    await (0, auth_repository_1.consumeVerificationCode)(verificationCode.verification_code_id);
    if (codeType === "account_reverification") {
        await (0, auth_repository_1.updateAccountStatus)(account.account_id, "active");
    }
    else {
        await (0, auth_repository_1.activateAccount)(account.account_id);
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
async function logoutUser(sessionId) {
    const session = await (0, auth_repository_1.findAuthSessionById)(sessionId);
    if (!session) {
        throw new app_error_1.AppError("Sesión no encontrada", 404);
    }
    if (!session.is_revoked) {
        await (0, auth_repository_1.revokeAuthSession)(sessionId, "logout");
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
async function refreshUserSession(refreshToken, meta = {}) {
    let decoded;
    try {
        decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
    }
    catch (error) {
        // ESTO NOS DIRÁ LA VERDAD ABSOLUTA
        console.error("🚨 FALLO REAL AL VERIFICAR EL JWT:", error);
        throw new app_error_1.AppError("Refresh token inválido o expirado", 401);
    }
    const currentSession = await (0, auth_repository_1.findAuthSessionById)(decoded.sessionId);
    if (!currentSession) {
        throw new app_error_1.AppError("Sesión no encontrada", 401);
    }
    if (currentSession.is_revoked) {
        throw new app_error_1.AppError("La sesión fue revocada", 401);
    }
    const now = new Date();
    if (new Date(currentSession.expires_at) <= now) {
        await (0, auth_repository_1.revokeAuthSession)(currentSession.session_id, "refresh_token_expired");
        throw new app_error_1.AppError("La sesión ha expirado", 401);
    }
    if (decoded.tokenId !== currentSession.current_refresh_token_id) {
        await (0, auth_repository_1.revokeAuthSession)(currentSession.session_id, "refresh_token_id_mismatch");
        throw new app_error_1.AppError("Refresh token inválido", 401);
    }
    const incomingRefreshTokenHash = (0, crypto_1.createHash)("sha256")
        .update(refreshToken)
        .digest("hex");
    if (currentSession.refresh_token_hash !== incomingRefreshTokenHash) {
        await (0, auth_repository_1.revokeAuthSession)(currentSession.session_id, "refresh_token_reuse_detected");
        throw new app_error_1.AppError("Se detectó reutilización de refresh token", 401);
    }
    const account = await (0, auth_repository_1.findAccountByIdForSession)(currentSession.account_id);
    if (!account) {
        await (0, auth_repository_1.revokeAuthSession)(currentSession.session_id, "account_not_found_on_refresh");
        throw new app_error_1.AppError("Cuenta no encontrada", 404);
    }
    if (!account.email_verified || account.account_status !== "active") {
        await (0, auth_repository_1.revokeAuthSession)(currentSession.session_id, "account_not_active_on_refresh");
        throw new app_error_1.AppError("La cuenta no está habilitada", 403);
    }
    const newRefreshExpiresAt = new Date(Date.now() + env_1.env.REFRESH_TOKEN_EXPIRES_IN_MS);
    const nextRefreshTokenId = (0, crypto_1.randomBytes)(16).toString("hex");
    const nextRefreshToken = (0, jwt_1.signRefreshToken)({
        sub: account.account_id,
        email: account.email,
        sessionId: currentSession.session_id,
        tokenId: nextRefreshTokenId,
    });
    const nextRefreshTokenHash = (0, crypto_1.createHash)("sha256")
        .update(nextRefreshToken)
        .digest("hex");
    await (0, auth_repository_1.rotateAuthSessionRefreshToken)(currentSession.session_id, nextRefreshTokenId, nextRefreshTokenHash, newRefreshExpiresAt);
    await (0, auth_repository_1.updateAuthSessionLastUsed)(currentSession.session_id);
    const accessExpiresAt = new Date(Date.now() + env_1.env.ACCESS_TOKEN_EXPIRES_IN_MS);
    const accessToken = (0, jwt_1.signAccessToken)({
        sub: account.account_id,
        email: account.email,
        sessionId: currentSession.session_id,
        permissions: account.permissions || [],
        role: account.role_code || "registered_user"
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
async function resendVerificationCode(email) {
    const account = await (0, auth_repository_1.findAccountBasicByEmail)(email);
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
    const latest = await (0, auth_repository_1.findLatestVerificationCodeByAccountId)(account.account_id, "register_email");
    const now = new Date();
    if (latest?.blocked_until && new Date(latest.blocked_until) > now) {
        throw new app_error_1.AppError("Debes esperar antes de solicitar otro código", 429);
    }
    if (latest?.last_sent_at) {
        const secondsSinceLastSend = (Date.now() - new Date(latest.last_sent_at).getTime()) / 1000;
        if (secondsSinceLastSend < 60) {
            throw new app_error_1.AppError("Espera al menos 60 segundos antes de reenviar el código", 429);
        }
    }
    if ((latest?.resend_count ?? 0) >= 3) {
        const blockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        if (latest) {
            await (0, auth_repository_1.blockVerificationCodeUntil)(latest.verification_code_id, blockedUntil);
        }
        throw new app_error_1.AppError("Se alcanzó el máximo de reenvíos permitidos", 429);
    }
    await (0, auth_repository_1.invalidateActiveVerificationCodes)(account.account_id, "register_email", "resend_requested");
    const code = (0, otp_1.generateOtpCode)(6);
    const codeHash = (0, otp_1.hashOtpCode)(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await (0, auth_repository_1.createVerificationCode)({
        accountId: account.account_id,
        codeHash,
        destination: account.email,
        destinationMasked: maskEmail(account.email),
        expiresAt,
    });
    await (0, mailer_1.sendVerificationEmail)(account.email, code);
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
async function requestPasswordReset(email) {
    const account = await (0, auth_repository_1.findAccountBasicByEmail)(email);
    if (!account) {
        return { message: "Si el correo está registrado, se enviará un enlace de recuperación." };
    }
    const resetToken = (0, token_1.generateSecureToken)();
    const tokenHash = (0, token_1.hashSecureToken)(resetToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await (0, auth_repository_1.createPasswordResetToken)(account.account_id, tokenHash, expiresAt);
    const resetLink = `${env_1.env.FRONTEND_ORIGIN}/reset-password?token=${resetToken}`;
    try {
        await (0, mailer_1.sendPasswordResetEmail)(account.email, resetLink);
    }
    catch (error) {
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
async function executePasswordReset(token, newPassword) {
    const tokenHash = (0, token_1.hashSecureToken)(token);
    const record = await (0, auth_repository_1.findValidPasswordResetToken)(tokenHash);
    if (!record) {
        throw new app_error_1.AppError("El enlace de recuperación es inválido o ha expirado.", 400);
    }
    const newPasswordHash = await (0, password_1.hashPassword)(newPassword);
    await (0, auth_repository_1.updateAccountPassword)(record.account_id, newPasswordHash);
    await (0, auth_repository_1.consumePasswordResetToken)(record.password_reset_token_id);
    await (0, auth_repository_1.revokeAllActiveSessionsByAccountId)(record.account_id, "password_reset");
    return { message: "Contraseña actualizada con éxito." };
}
/**
 * Descripción: Recupera la lista completa de usuarios.
 * @return {Promise<Array>} Lista de usuarios.
 * @throws {Ninguna}
 */
async function getAllUsers() {
    const users = await (0, auth_repository_1.fetchAllUsersFromDb)();
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
async function updateUserStatus(userId, newStatus) {
    const validStatuses = ["active", "suspended", "pending_verification", "pending_revalidation"];
    if (!validStatuses.includes(newStatus)) {
        throw new app_error_1.AppError("Estado de cuenta no válido", 400);
    }
    const affectedRows = await (0, auth_repository_1.updateUserStatusInDb)(userId, newStatus);
    if (affectedRows === 0) {
        throw new app_error_1.AppError("Usuario no encontrado", 404);
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
async function deleteUser(userId) {
    const roleCode = await (0, auth_repository_1.getUserRoleCodeById)(userId);
    if (roleCode === 'super_admin') {
        throw new app_error_1.AppError("Acción denegada: No puedes eliminar a un Super Administrador", 403);
    }
    const affectedRows = await (0, auth_repository_1.deleteUserFromDb)(userId);
    if (affectedRows === 0) {
        throw new app_error_1.AppError("Usuario no encontrado", 404);
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
async function editUserAdmin(userId, fullName, email, roleCode, newPassword) {
    let newPasswordHash;
    if (newPassword && newPassword.trim() !== "") {
        newPasswordHash = await (0, password_1.hashPassword)(newPassword);
    }
    // Buscamos el ID numérico del rol seleccionado
    const roleId = await (0, auth_repository_1.findRoleIdByCode)(roleCode);
    if (!roleId) {
        throw new app_error_1.AppError("El rol seleccionado no es válido", 400);
    }
    const affectedRows = await (0, auth_repository_1.updateUserAdminInDb)(userId, fullName, email, roleId, newPasswordHash);
    if (affectedRows === 0) {
        throw new app_error_1.AppError("Usuario no encontrado", 404);
    }
    return { message: "Usuario actualizado correctamente" };
}
/**
 * Descripción: Devuelve todos los roles activos disponibles para asignar.
 * @return {Promise<Array>} Lista de roles activos.
 * @throws {Ninguna}
 */
async function getActiveRoles() {
    const roles = await (0, auth_repository_1.fetchActiveRolesFromDb)();
    return roles;
}
