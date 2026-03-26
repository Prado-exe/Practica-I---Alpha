import { pool } from "../config/db";

export async function fetchAllTagsFromDb() {
  const { rows } = await pool.query(`
    SELECT tag_id, name 
    FROM tags 
    ORDER BY name ASC
  `);
  return rows;
}