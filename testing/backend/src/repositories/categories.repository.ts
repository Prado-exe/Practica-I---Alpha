import { pool } from "../config/db";

export async function fetchAllCategoriesFromDb() {
  const { rows } = await pool.query(`
    SELECT category_id, legal_name 
    FROM categories 
    WHERE category_status = 'active' 
    ORDER BY legal_name ASC
  `);
  return rows;
}