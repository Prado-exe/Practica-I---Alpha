import { Pool } from "pg";
import { env } from "./env";

export const pool = new Pool({
  host: env.DB_HOST_POSTGRES,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
});

export async function testDbConnection(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
    console.log("Base de datos PostgreSQL conectada");
  } finally {
    client.release();
  }
}