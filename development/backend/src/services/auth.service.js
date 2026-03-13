const {
  findAccountByEmail,
  findAccountByUsername,
  createAccount,
  createVerificationCode,
  findAccountLoginByEmail,
  findAccountBasicByEmail,
  findLatestVerificationCodeByAccountId,
  incrementVerificationAttempts,
  consumeVerificationCode,
  activateAccount,
  assignRegisteredUserRole,
} = require("../repositories/auth.repository");

const { hashPassword, comparePassword} = require("../utils/password");

const { generateOtpCode, hashOtpCode } = require("../utils/otp");
const { sendVerificationEmail } = require("../utils/mailer");

function usernameFromEmail(email) {
  return email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
}

async function buildUniqueUsername(base) {
  let counter = 0;

  while (true) {
    const candidate = counter === 0 ? base : `${base}${counter}`;
    const exists = await findAccountByUsername(candidate);
    if (!exists) return candidate;
    counter += 1;
  }
}

function maskEmail(email) {
  const [local, domain] = email.split("@");
  const masked = local.length <= 3 ? `${local[0] || ""}***` : `${local.slice(0, 3)}***`;
  return `${masked}@${domain}`;
}

async function registerUser(payload) {
  const existing = await findAccountByEmail(payload.email);
  if (existing) {const error = new Error("El correo ya está registrado"); error.statusCode = 409; throw error;}
  const baseUsername = usernameFromEmail(payload.email);
  const username = await buildUniqueUsername(baseUsername);
  const passwordHash = await hashPassword(payload.password);
  const account = await createAccount({
    institutionId: null,
    username,
    email: payload.email,
    passwordHash,
    fullName: payload.name,
    accountStatus: "pending_verification",
  });
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
    account,
    verification,
  };
}

async function loginUser(payload) {
  const account = await findAccountLoginByEmail(payload.email);
  if (!account) {
    const error = new Error("Credenciales inválidas");
    error.statusCode = 401;
    throw error;
  }
  const passwordValid = await comparePassword(payload.password, account.password_hash);
  if (!passwordValid) {
    const error = new Error("Credenciales inválidas");
    error.statusCode = 401;
    throw error;
  }
  if (!account.email_verified || account.account_status !== "active") {
    const error = new Error("Tu cuenta aún no ha sido validada por correo");
    error.statusCode = 403;
    throw error;
  }
  return {
    message: "Login válido. Próximo paso: generar sesión/token.",
    account: {
      account_id: account.account_id,
      username: account.username,
      email: account.email,
      full_name: account.full_name,
      account_status: account.account_status,
      email_verified: account.email_verified,
    },
  };
}

async function verifyEmailCode(payload) {
  const account = await findAccountBasicByEmail(payload.email);
  if (!account) {const error = new Error("No existe una cuenta asociada a ese correo"); error.statusCode = 404; throw error;}

  if (account.email_verified && account.account_status === "active") {return {valid: true,message: "La cuenta ya estaba verificada",};}

  const verificationCode = await findLatestVerificationCodeByAccountId(account.account_id);

  if (!verificationCode) {const error = new Error("No existe un código de verificación para esta cuenta"); error.statusCode = 404; throw error;}

  if (verificationCode.consumed_at) {const error = new Error("Este código ya fue utilizado"); error.statusCode = 400; throw error;}

  const now = new Date();
  const expiresAt = new Date(verificationCode.expires_at);

  if (expiresAt < now) {const error = new Error("El código ha expirado"); error.statusCode = 400; throw error;}

  if (verificationCode.attempts_count >= verificationCode.max_attempts) {const error = new Error("Se alcanzó el máximo de intentos para este código"); error.statusCode = 400; throw error;}

  const inputCodeHash = hashOtpCode(payload.codigo);

  if (inputCodeHash !== verificationCode.code_hash) {await incrementVerificationAttempts(verificationCode.verification_code_id); const error = new Error("El código ingresado es incorrecto"); error.statusCode = 400; throw error;}

  await consumeVerificationCode(verificationCode.verification_code_id);
  await activateAccount(account.account_id);
  await assignRegisteredUserRole(account.account_id);

  return {valid: true, message: "Cuenta verificada correctamente",};
}

module.exports = { registerUser, loginUser,verifyEmailCode, };