require("dotenv").config();

module.exports = {
  PORT: Number(process.env.PORT || 3000),

  DB_HOST_POSTGRES: process.env.DB_HOST_POSTGRES,
  DB_PORT: Number(process.env.DB_PORT || 5432),
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_NAME: process.env.DB_NAME,

  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: Number(process.env.SMTP_PORT || 2525),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
};