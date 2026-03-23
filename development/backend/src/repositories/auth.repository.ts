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

export async function incrementVerificationAttempts(verificationCodeId: number): Promise<void> {
  const query = `
    UPDATE verification_codes
    SET attempts_count = attempts_count + 1
    WHERE verification_code_id = $1
  `;

  await pool.query(query, [verificationCodeId]);
}

export async function consumeVerificationCode(verificationCodeId: number): Promise<void> {
  const query = `
    UPDATE verification_codes
    SET consumed_at = NOW()
    WHERE verification_code_id = $1
  `;

  await pool.query(query, [verificationCodeId]);
}

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

export async function deleteUserFromDb(userId: string | number) {
  const query = "DELETE FROM accounts WHERE account_id = $1";
  const { rowCount } = await pool.query(query, [userId]);
  return rowCount ?? 0;
}