const { Pool } = require("pg");
const env = require("./env");

const pool = new Pool({
  host: env.DB_HOST_POSTGRES,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
});

module.exports = pool;