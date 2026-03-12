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
  institutionId,
  username,
  email,
  passwordHash,
  fullName,
  accountStatus,
}) {
  const query = `
    INSERT INTO accounts (
      institution_id,
      username,
      email,
      password_hash,
      full_name,
      account_status,
      email_verified,
      phone_verified,
      registration_started_at,
      created_at,
      updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      FALSE, FALSE, NOW(), NOW(), NOW()
    )
    RETURNING account_id, username, email, full_name, account_status
  `;

  const values = [
    institutionId,
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

module.exports = {
  findAccountByEmail,
  findAccountByUsername,
  createAccount,
  createVerificationCode,
  findAccountLoginByEmail,
};