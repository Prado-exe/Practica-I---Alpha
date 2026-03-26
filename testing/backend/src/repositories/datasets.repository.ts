// backend/src/repositories/datasets.repository.ts
import { pool } from "../config/db";

// 1. FUNCIÓN DE LECTURA (La que causaba el error)
export async function fetchDatasetsPaginated(accountId: number, isAdmin: boolean, search: string, limit: number, offset: number) {
  let baseQuery = `
    FROM datasets d
    INNER JOIN categories c ON d.category_id = c.category_id
    LEFT JOIN institutions i ON d.institution_id = i.institution_id
    WHERE d.dataset_status != 'deleted'
  `;
  
  const queryParams: any[] = [];
  let paramCount = 0;

  // Lógica de privacidad: Si no es admin, solo ve los suyos
  if (!isAdmin) {
    paramCount++;
    queryParams.push(accountId);
    baseQuery += ` AND d.owner_account_id = $${paramCount}`;
  }

  if (search) {
    paramCount++;
    queryParams.push(`%${search}%`);
    baseQuery += ` AND (d.title ILIKE $${paramCount} OR d.description ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`;
  }

  const countRes = await pool.query(`SELECT COUNT(*) ${baseQuery}`, queryParams);
  const total = parseInt(countRes.rows[0].count, 10);

  paramCount++; queryParams.push(limit); const limitParam = paramCount;
  paramCount++; queryParams.push(offset); const offsetParam = paramCount;

  const dataQuery = `
    SELECT 
      d.dataset_id, d.title, d.dataset_status, d.access_level, d.created_at,
      c.name as category_name, i.legal_name as institution_name
    ${baseQuery}
    ORDER BY d.created_at DESC
    LIMIT $${limitParam} OFFSET $${offsetParam}
  `;
  
  const { rows } = await pool.query(dataQuery, queryParams);
  return { total, data: rows };
}

// 2. FUNCIÓN DE CREACIÓN COMPLETA
export async function createFullDatasetInDb(ownerAccountId: number, isAdmin: boolean, input: any) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Si es admin se publica, si no, queda en validación
    const status = isAdmin ? 'published' : 'pending_validation';

    const datasetQuery = `
      INSERT INTO datasets (
        owner_account_id, category_id, institution_id, license_id, ods_objective_id,
        title, summary, description, access_level, dataset_status, creation_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE)
      RETURNING dataset_id;
    `;
    
    const datasetRes = await client.query(datasetQuery, [
      ownerAccountId, input.category_id, input.institution_id || null,
      input.license_id, input.ods_objective_id || null,
      input.title, input.summary, input.description,
      input.access_level || 'public', status
    ]);
    const datasetId = datasetRes.rows[0].dataset_id;

    // Si es usuario normal, registramos la solicitud formal
    if (!isAdmin) {
      const requestQuery = `
        INSERT INTO dataset_requests (dataset_id, requester_account_id, request_type, request_status)
        VALUES ($1, $2, 'create', 'pending')
      `;
      await client.query(requestQuery, [datasetId, ownerAccountId]);
    }

    await client.query('COMMIT');
    return { datasetId, title: input.title };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}