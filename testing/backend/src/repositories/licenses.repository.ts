import { pool } from "../config/db";

export async function fetchAllLicensesFromDb() {
  const { rows } = await pool.query(`
    SELECT license_id, name, code 
    FROM licenses 
    WHERE is_active = TRUE 
    ORDER BY name ASC
  `);
  return rows;
}