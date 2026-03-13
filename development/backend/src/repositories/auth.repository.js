const pool = require("../config/db");

async function findAccountByEmail(email) {
  const query = `
    SELECT account_id, email, username
    FROM accounts
    WHERE email = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
}

async function findAccountByUsername(username) {
  const query = `
    SELECT account_id, username
    FROM accounts
    WHERE username = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [username]);
  return rows[0] || null;
}

async function createAccount({
  username,
  email,
  passwordHash,
  fullName,
  accountStatus,
}) {
  const query = `
    INSERT INTO accounts (
      username,
      email,
      password_hash,
      full_name,
      account_status,
      email_verified,
      failed_login_count,
      registration_started_at,
      created_at,
      updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5,
      FALSE, 0, NOW(), NOW(), NOW()
    )
    RETURNING account_id, username, email, full_name, account_status
  `;

  const values = [
    username,
    email,
    passwordHash,
    fullName,
    accountStatus,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function createVerificationCode({
  accountId,
  codeHash,
  destination,
  destinationMasked,
  expiresAt,
}) {
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
    accountId,
    destination,
    destinationMasked,
    codeHash,
    expiresAt,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function findAccountLoginByEmail(email) {
  const query = `
    SELECT
      account_id,
      username,
      email,
      password_hash,
      full_name,
      account_status,
      email_verified,
      failed_login_count,
      locked_until
    FROM accounts
    WHERE email = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
}

async function findAccountBasicByEmail(email) {
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
  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
}

async function findLatestVerificationCodeByAccountId(accountId) {
  const query = `
    SELECT
      verification_code_id,
      account_id,
      code_type,
      channel,
      destination,
      code_hash,
      expires_at,
      consumed_at,
      attempts_count,
      max_attempts,
      resend_count,
      created_at
    FROM verification_codes
    WHERE account_id = $1
      AND code_type = 'register_email'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [accountId]);
  return rows[0] || null;
}

async function incrementVerificationAttempts(verificationCodeId) {
  const query = `
    UPDATE verification_codes
    SET attempts_count = attempts_count + 1
    WHERE verification_code_id = $1
  `;
  await pool.query(query, [verificationCodeId]);
}

async function incrementVerificationAttempts(verificationCodeId) {
  const query = `
    UPDATE verification_codes
    SET attempts_count = attempts_count + 1
    WHERE verification_code_id = $1
  `;
  await pool.query(query, [verificationCodeId]);
}

async function consumeVerificationCode(verificationCodeId) {
  const query = `
    UPDATE verification_codes
    SET consumed_at = NOW()
    WHERE verification_code_id = $1
  `;
  await pool.query(query, [verificationCodeId]);
}

async function activateAccount(accountId) {
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

async function assignRegisteredUserRole(accountId) {
  const query = `
    INSERT INTO account_role_assignments (
      account_id,
      role_id,
      institution_id,
      assigned_by_account_id,
      assignment_reason,
      is_active,
      starts_at,
      created_at,
      updated_at
    )
    SELECT
      $1,
      r.role_id,
      NULL,
      NULL,
      'Asignación automática tras verificación de correo',
      TRUE,
      NOW(),
      NOW(),
      NOW()
    FROM roles r
    WHERE r.code = 'registered_user'
    ON CONFLICT DO NOTHING
  `;
  await pool.query(query, [accountId]);
}

module.exports = {
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
};