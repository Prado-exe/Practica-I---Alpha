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
      accountId,
      data.institution_id || null,
      data.category_id,
      data.license_id,
      data.title,
      data.summary,
      data.description,
      'draft', // Forzado como borrador inicial
      data.access_level,
      data.creation_date,
      data.geographic_coverage || null,
      data.update_frequency || null,
      data.source_url || null,
      data.temporal_coverage_start || null,
      data.temporal_coverage_end || null
    ]);

    const dataset_id = datasetRes.rows[0].dataset_id;

    // Inserción de archivos (Asumiendo tabla de relación dataset_files)
    for (const file of data.files) {
      await client.query(`
        INSERT INTO aws_file_references (
          storage_key, file_url, file_format_id, file_size_bytes, mime_type, 
          file_category, owner_account_id, status
        ) VALUES ($1, $2, (SELECT file_format_id FROM file_formats WHERE mime_type = $3 LIMIT 1), $4, $3, $5, $6, 'active')
      `, [file.storage_key, file.file_url, file.mime_type, file.file_size_bytes, 'dataset_source', accountId]);
      
      // Aquí se vincularía el file_id con el dataset_id en una tabla intermedia si existe.
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