<<<<<<< HEAD
/**
 * ============================================================================
 * MÓDULO: Repositorio de Conjuntos de Datos (datasets.repository.ts)
 * * PROPÓSITO: Gestionar la persistencia de metadatos y archivos de datasets.
 * * RESPONSABILIDAD: Ejecutar transacciones SQL para la creación de datasets, 
 * vinculación de archivos y registro de eventos de auditoría.
 * ============================================================================
 */
import { pool } from "../config/db";

/**
 * Descripción: Crea un registro completo de dataset y sus archivos asociados en una sola transacción.
 * POR QUÉ: Implementa un bloque BEGIN/COMMIT para garantizar la integridad referencial. Si la inserción de archivos falla, se revierte la creación del dataset para evitar registros "fantasma" sin contenido. Se utiliza la cláusula RETURNING para obtener el `dataset_id` generado y usarlo en las tablas dependientes.
 * @param accountId {number} ID del creador.
 * @param isAdmin {boolean} Flag de privilegios.
 * @param data {any} Metadatos validados del dataset y arreglo de archivos.
 * @return {Promise<Object>} El dataset creado con su ID único.
 * @throws {Error} Ante fallos en la sintaxis SQL o conectividad.
 */
export async function createFullDatasetInDb(accountId: number, isAdmin: boolean, data: any) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const datasetQuery = `
      INSERT INTO datasets (
        owner_account_id, institution_id, category_id, license_id, 
        title, summary, description, dataset_status, access_level,
        creation_date, geographic_coverage, update_frequency, 
        source_url, temporal_coverage_start, temporal_coverage_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING dataset_id
    `;
    
    const datasetRes = await client.query(datasetQuery, [
      accountId, data.institution_id || null, data.category_id, data.license_id,
      data.title, data.summary, data.description, 'draft', data.access_level,
      data.creation_date, data.geographic_coverage || null, data.update_frequency || null,
      data.source_url || null, data.temporal_coverage_start || null, data.temporal_coverage_end || null
    ]);

    const dataset_id = datasetRes.rows[0].dataset_id;

    for (const file of data.files) {
      // 1. Normalización de MIME types rebeldes (Ej: Windows ZIP)
      let safeMimeType = file.mime_type;
      if (safeMimeType === 'application/x-zip-compressed') safeMimeType = 'application/zip';
      if (safeMimeType === 'application/vnd.ms-excel') safeMimeType = 'text/csv'; // Por si Windows lee los CSV como Excel

      // 2. Extracción segura de la extensión para cumplir el CHECK de dataset_files
      const ext = file.display_name.split('.').pop()?.toLowerCase();
      const allowedFormats = ['csv', 'json', 'xml', 'xlsx', 'pdf', 'zip', 'txt'];
      const finalFormat = allowedFormats.includes(ext) ? ext : 'txt'; // Fallback a txt si es un formato extraño

      // 3. Inserción con COALESCE para evitar el error "null value in column file_format_id"
      const fileRes = await client.query(`
        INSERT INTO aws_file_references (
          storage_key, file_url, file_format_id, file_size_bytes, mime_type, 
          file_category, owner_account_id, status
        ) VALUES (
          $1, $2, 
          COALESCE(
            (SELECT file_format_id FROM file_formats WHERE mime_type = $3 LIMIT 1),
            (SELECT file_format_id FROM file_formats LIMIT 1) -- Salvavidas: toma el primer ID disponible si no hay match
          ), 
          $4, $3, $5, $6, 'active'
        )
        RETURNING aws_file_reference_id
      `, [file.storage_key, file.file_url, safeMimeType, file.file_size_bytes, 'dataset_source', accountId]);
      
      const aws_file_id = fileRes.rows[0].aws_file_reference_id;

      // 4. Inserción en tabla relacional con el formato validado
      await client.query(`
        INSERT INTO dataset_files (
          dataset_id, aws_file_reference_id, file_role, display_name, file_format, mime_type, file_size_bytes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        dataset_id, aws_file_id, file.file_role || 'source', file.display_name, 
        finalFormat, safeMimeType, file.file_size_bytes
      ]);
    }

    await client.query('COMMIT');
    return { dataset_id, title: data.title };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Descripción: Registra de forma independiente un evento de auditoría para un dataset.
 * POR QUÉ: Se separa de la creación para permitir que eventos posteriores (descargas, ediciones, cambios de estado) utilicen la misma lógica. El uso de `JSONB` para metadata permite guardar el estado del objeto en el momento del evento para auditoría forense futura.
 * @param eventData {any} Datos del evento: ID del dataset, actor, tipo y resultado.
 * @return {Promise<void>}
 */
export async function recordDatasetEvent(eventData: any) {
  const query = `
    INSERT INTO dataset_events (
      dataset_id, actor_account_id, event_type, event_result, event_comment
    ) VALUES ($1, $2, $3, $4, $5)
  `;
  await pool.query(query, [
    eventData.dataset_id,
    eventData.actor_account_id,
    eventData.event_type,
    eventData.event_result,
    eventData.event_comment
  ]);
}

// En src/repositories/datasets.repository.ts
export async function fetchDatasetsPaginated(accountId: number, isAdmin: boolean, search: string, limit: number, offset: number) {
  let baseQuery = `
    FROM datasets d
    LEFT JOIN categories c ON d.category_id = c.category_id
    LEFT JOIN institutions i ON d.institution_id = i.institution_id
    WHERE 1=1
  `;
  
  const queryParams: any[] = [];
  
  if (search) {
    queryParams.push(`%${search}%`);
    baseQuery += ` AND (d.title ILIKE $1 OR d.description ILIKE $1)`;
  }

  const countQuery = `SELECT COUNT(*) ${baseQuery}`;
  const countRes = await pool.query(countQuery, queryParams);
  const total = parseInt(countRes.rows[0].count, 10);

  queryParams.push(limit, offset);
  
  // 👇 SE AGREGAN d.category_id y d.institution_id al SELECT 👇
  const dataQuery = `
    SELECT 
      d.dataset_id, 
      d.category_id,
      d.institution_id,
      d.title as nombre, 
      c.name as categoria, 
      i.legal_name as institucion, 
      TO_CHAR(d.created_at, 'YYYY-MM-DD') as fecha, 
      d.dataset_status
    ${baseQuery}
    ORDER BY d.created_at DESC
    LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
  `;
  
  const { rows } = await pool.query(dataQuery, queryParams);
  
  return { total, data: rows };
}

// En src/repositories/datasets.repository.ts

/**
 * 1. FUNCIÓN PARA EL BOTÓN "REVISAR" (GET)
 * Obtiene el dataset, sus archivos y su historial de eventos.
 */
export async function fetchDatasetDetailsFromDb(id: number) {
  // A. Metadatos principales
  const dsRes = await pool.query(`
    SELECT d.*, c.name as category_name, i.legal_name as institution_name, l.name as license_name
    FROM datasets d LEFT JOIN categories c ON d.category_id = c.category_id
    LEFT JOIN institutions i ON d.institution_id = i.institution_id
    LEFT JOIN licenses l ON d.license_id = l.license_id
    WHERE d.dataset_id = $1
  `, [id]);
  if (dsRes.rowCount === 0) return null;
  const dataset = dsRes.rows[0];

  // B. Archivos subidos
  const filesRes = await pool.query(`
    SELECT afr.aws_file_reference_id, df.display_name, afr.file_url, afr.storage_key, afr.mime_type, afr.file_size_bytes
    FROM aws_file_references afr
    INNER JOIN dataset_files df ON afr.aws_file_reference_id = df.aws_file_reference_id
    WHERE df.dataset_id = $1
  `, [id]);
  dataset.files = filesRes.rows;

  // C. Eventos de auditoría
  const eventsRes = await pool.query(`
    SELECT de.dataset_event_id, de.event_type, de.event_result, de.event_comment, de.created_at,
           acc.email as actor_email
    FROM dataset_events de
    LEFT JOIN accounts acc ON de.actor_account_id = acc.account_id
    WHERE de.dataset_id = $1
    ORDER BY de.created_at DESC
  `, [id]);
  dataset.events = eventsRes.rows;

  return dataset;
}

/**
 * 2. FUNCIÓN PARA EL BOTÓN "ELIMINAR" (DELETE LÓGICO)
 * Cambia el estado y registra el evento en una transacción.
 */
export async function softDeleteDatasetInDb(datasetId: number, accountId: number) {
=======
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
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
<<<<<<< HEAD
    const updateQuery = `
      UPDATE datasets 
      SET dataset_status = 'deleted', deleted_at = NOW(), updated_at = NOW()
      WHERE dataset_id = $1 AND dataset_status != 'deleted'
      RETURNING dataset_id, title
    `;
    const res = await client.query(updateQuery, [datasetId]);
    
    if (res.rowCount === 0) throw new Error("Dataset no encontrado o ya eliminado");

    await client.query(`
      INSERT INTO dataset_events (dataset_id, actor_account_id, event_type, event_result, event_comment)
      VALUES ($1, $2, 'deleted', 'success', 'Dataset eliminado lógicamente por administrador')
    `, [datasetId, accountId]);

    await client.query('COMMIT');
    return res.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 3. FUNCIÓN PARA EL BOTÓN "EDITAR" (UPDATE)
 * Actualiza los metadatos y registra el evento 'edited'.
 */
export async function updateDatasetInDb(datasetId: number, accountId: number, data: any) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateQuery = `
      UPDATE datasets SET 
        title = $1, category_id = $2, license_id = $3, institution_id = $4,
        summary = $5, description = $6, access_level = $7, dataset_status = $8,
        creation_date = $9, geographic_coverage = $10, update_frequency = $11, 
        source_url = $12, temporal_coverage_start = $13, temporal_coverage_end = $14,
        updated_at = NOW()
      WHERE dataset_id = $15
      RETURNING *
    `;
    
    const res = await client.query(updateQuery, [
      data.title, data.category_id, data.license_id, data.institution_id || null,
      data.summary, data.description, data.access_level, data.dataset_status || 'draft',
      data.creation_date, data.geographic_coverage || null, data.update_frequency || null,
      data.source_url || null, data.temporal_coverage_start || null, data.temporal_coverage_end || null,
      datasetId
    ]);

    if (res.rowCount === 0) throw new Error("Dataset no encontrado");

    await client.query(`
      INSERT INTO dataset_events (dataset_id, actor_account_id, event_type, event_result, event_comment)
      VALUES ($1, $2, 'edited', 'success', 'Metadatos del dataset actualizados')
    `, [datasetId, accountId]);

    await client.query('COMMIT');
    return res.rows[0];
=======
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
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}