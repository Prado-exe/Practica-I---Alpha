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

export async function createFullDatasetInDb(ownerAccountId: number, isAdmin: boolean, input: any) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Si es admin se publica, si no, queda en validación
    const status = isAdmin ? 'published' : 'pending_validation';

    // 1. Insertar el Dataset
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

    // 2. Procesar e insertar CADA archivo del array
    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];

      // A) Buscar el formato del archivo (file_format_id) según su mime_type
      const formatRes = await client.query(
        `SELECT file_format_id FROM file_formats WHERE mime_type = $1 LIMIT 1`, 
        [file.mime_type]
      );
      const fileFormatId = formatRes.rows.length > 0 ? formatRes.rows[0].file_format_id : 1; // 1 como fallback

      // B) Insertar en aws_file_references
      const awsRefQuery = `
        INSERT INTO aws_file_references 
        (storage_key, file_url, file_format_id, file_size_bytes, mime_type, file_category, file_scope, owner_account_id, status)
        VALUES ($1, $2, $3, $4, $5, 'dataset', 'public', $6, 'active')
        RETURNING aws_file_reference_id;
      `;
      const awsRefRes = await client.query(awsRefQuery, [
        file.storage_key, file.file_url, fileFormatId, 
        file.file_size_bytes, file.mime_type, ownerAccountId
      ]);
      const newAwsFileRefId = awsRefRes.rows[0].aws_file_reference_id;

      // C) Insertar en la tabla intermedia: dataset_files
      const dsFileQuery = `
        INSERT INTO dataset_files
        (dataset_id, aws_file_reference_id, file_role, display_name, file_format, mime_type, file_size_bytes, is_primary, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      await client.query(dsFileQuery, [
        datasetId, 
        newAwsFileRefId, 
        file.file_role || 'source', 
        file.display_name,
        file.file_format || 'csv', 
        file.mime_type, 
        file.file_size_bytes, 
        file.is_primary || false, 
        i // sort_order
      ]);
    }

    // 3. Si no es admin, registrar la solicitud para revisión
    if (!isAdmin) {
      const requestQuery = `
        INSERT INTO dataset_requests (dataset_id, requester_account_id, request_type, request_status)
        VALUES ($1, $2, 'create', 'pending')
      `;
      await client.query(requestQuery, [datasetId, ownerAccountId]);
    }

    await client.query('COMMIT');
    return { datasetId, title: input.title, filesUploaded: input.files.length };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}