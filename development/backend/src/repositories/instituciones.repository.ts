import { pool } from "../config/db";

// 1. Obtener instituciones junto con la URL de su logo
export async function fetchInstitutionsFromDb() {
  const query = `
    SELECT i.*, afr.file_url as logo_url
    FROM institutions i
    INNER JOIN aws_file_references afr ON i.logo_file_id = afr.aws_file_reference_id
    ORDER BY i.created_at DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
}

// 2. Crear Institución y su Referencia de Archivo (Transacción)
export async function createInstitutionInDb(instData: any, fileData: any, accountId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Paso A: Obtener el file_format_id basándonos en el mime_type (ej. image/png)
    // Nota: Asumimos que la tabla file_formats existe. Si no, usamos un ID por defecto (1).
    const formatRes = await client.query(`SELECT file_format_id FROM file_formats WHERE mime_type = $1 LIMIT 1`, [fileData.mime_type]);
    const fileFormatId = formatRes.rows.length > 0 ? formatRes.rows[0].file_format_id : 1;

    // Paso B: Insertar la referencia en aws_file_references
    const fileQuery = `
      INSERT INTO aws_file_references 
      (storage_key, file_url, file_format_id, file_size_bytes, mime_type, file_category, file_scope, owner_account_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING aws_file_reference_id
    `;
    const fileRes = await client.query(fileQuery, [
      fileData.storage_key,
      fileData.file_url,
      fileFormatId,
      fileData.file_size_bytes,
      fileData.mime_type,
      'logo_institucion',
      instData.access_level === 'public' ? 'public' : 'internal',
      accountId,
      'active'
    ]);
    const logoFileId = fileRes.rows[0].aws_file_reference_id;

    // Paso C: Insertar la institución
    const instQuery = `
      INSERT INTO institutions 
      (legal_name, short_name, tax_identifier, institution_type, country_name, description, main_thematic_area, data_role, usage_license, logo_file_id, access_level, institution_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const instRes = await client.query(instQuery, [
      instData.legal_name,
      instData.short_name,
      instData.tax_identifier || null,
      instData.institution_type,
      instData.country_name,
      instData.description,
      instData.main_thematic_area || null,
      instData.data_role,
      instData.usage_license || null,
      logoFileId,
      instData.access_level, // 'public' o 'internal'
      instData.institution_status // 'active' o 'inactive'
    ]);

    await client.query('COMMIT');
    return { ...instRes.rows[0], logo_url: fileData.file_url };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// 3. Actualizar Institución (Transacción)
export async function updateInstitutionInDb(id: number, instData: any, fileData: any, accountId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let newLogoFileId = null;

    // Si el usuario subió una imagen nueva, creamos el nuevo registro en aws_file_references
    if (fileData) {
      const formatRes = await client.query(`SELECT file_format_id FROM file_formats WHERE mime_type = $1 LIMIT 1`, [fileData.mime_type]);
      const fileFormatId = formatRes.rows.length > 0 ? formatRes.rows[0].file_format_id : 1;

      const fileQuery = `
        INSERT INTO aws_file_references 
        (storage_key, file_url, file_format_id, file_size_bytes, mime_type, file_category, file_scope, owner_account_id, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING aws_file_reference_id
      `;
      const fileRes = await client.query(fileQuery, [
        fileData.storage_key, fileData.file_url, fileFormatId, fileData.file_size_bytes,
        fileData.mime_type, 'logo_institucion', instData.access_level === 'public' ? 'public' : 'internal', accountId, 'active'
      ]);
      newLogoFileId = fileRes.rows[0].aws_file_reference_id;
    }

    // Preparamos la actualización de la institución
    let instQuery = "";
    let queryParams = [];

    if (newLogoFileId) {
      // Actualizamos TODO, incluyendo el nuevo logo
      instQuery = `
        UPDATE institutions SET 
          legal_name = $1, short_name = $2, institution_type = $3, country_name = $4, 
          description = $5, data_role = $6, access_level = $7, institution_status = $8, 
          logo_file_id = $9, updated_at = NOW()
        WHERE institution_id = $10 RETURNING *
      `;
      queryParams = [instData.legal_name, instData.short_name, instData.institution_type, instData.country_name, instData.description, instData.data_role, instData.access_level, instData.institution_status, newLogoFileId, id];
    } else {
      // Actualizamos SOLO los textos (Mantiene el logo_file_id que ya tenía)
      instQuery = `
        UPDATE institutions SET 
          legal_name = $1, short_name = $2, institution_type = $3, country_name = $4, 
          description = $5, data_role = $6, access_level = $7, institution_status = $8, 
          updated_at = NOW()
        WHERE institution_id = $9 RETURNING *
      `;
      queryParams = [instData.legal_name, instData.short_name, instData.institution_type, instData.country_name, instData.description, instData.data_role, instData.access_level, instData.institution_status, id];
    }

    const instRes = await client.query(instQuery, queryParams);

    if (instRes.rowCount === 0) {
      throw new Error("Institución no encontrada");
    }

    await client.query('COMMIT');
    return instRes.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// 4. Eliminar Institución
export async function deleteInstitutionFromDb(id: number) {
  // Nota: Por la regla ON DELETE RESTRICT, no borramos la imagen de aws_file_references, 
  // solo borramos la institución. La imagen quedará "huérfana" pero no romperá la BD.
  const query = `DELETE FROM institutions WHERE institution_id = $1`;
  const { rowCount } = await pool.query(query, [id]);
  return rowCount ?? 0;
}