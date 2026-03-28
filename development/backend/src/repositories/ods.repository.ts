import { pool } from "../config/db";

export async function fetchAllOdsFromDb() {
  const { rows } = await pool.query(`
    SELECT ods_id, ods_number, name 
    FROM ods_objectives 
    ORDER BY ods_number ASC
  `);
  return rows;
}