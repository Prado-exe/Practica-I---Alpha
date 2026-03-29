<<<<<<< HEAD
import { pool } from "../config/db";

// 1. Obtener instituciones junto con la URL de su logo y el storage_key
=======
/**
 * ============================================================================
 * MÓDULO: Repositorio de Instituciones (instituciones.repository.ts)
 * * PROPÓSITO: Administrar el acceso a datos de las instituciones y sus relaciones.
 * * RESPONSABILIDAD: Ejecutar operaciones CRUD sobre la tabla `institutions`, 
 * garantizando la integridad referencial con la tabla `aws_file_references` para los logos.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Integridad Transaccional: Las operaciones de creación y actualización de 
 * instituciones con logos nuevos utilizan transacciones explícitas (`BEGIN`/`COMMIT`). 
 * Esto asegura que no queden registros de archivos "huérfanos" en la base de datos 
 * si falla la inserción de la institución principal.
 * - Búsqueda Dinámica: Se construye SQL dinámico de forma segura empujando variables
 * a un arreglo de parámetros (`queryParams`) para evitar inyección SQL al aplicar filtros.
 * ============================================================================
 */
import { pool } from "../config/db";

/**
 * Descripción: Obtiene el catálogo completo de instituciones cruzando la información con sus respectivos logos.
 * POR QUÉ: Se utiliza un `INNER JOIN` directo con `aws_file_references` asumiendo que el diseño de la base de datos exige que toda institución tenga obligatoriamente un logo asociado (`logo_file_id` no nulo). El ordenamiento descendente (`ORDER BY created_at DESC`) está pensado para el panel de administración, mostrando los registros creados más recientemente en la parte superior.
 * @param {void} No requiere parámetros de entrada.
 * @return {Promise<Array>} Lista de instituciones con las columnas `logo_url` y `storage_key` adjuntas.
 * @throws {Ninguna}
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function fetchInstitutionsFromDb() {
  const query = `
    SELECT i.*, afr.file_url as logo_url, afr.storage_key 
    FROM institutions i
    INNER JOIN aws_file_references afr ON i.logo_file_id = afr.aws_file_reference_id
    ORDER BY i.created_at DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
}

<<<<<<< HEAD
// 2. Crear Institución y su Referencia de Archivo (Transacción)
=======
/**
 * Descripción: Registra una nueva institución y su archivo de logo asociado de manera atómica.
 * POR QUÉ: Implementa una transacción SQL manual (`BEGIN/COMMIT/ROLLBACK`). Dado que la inserción depende de guardar primero el archivo en `aws_file_references` para obtener su ID y usarlo como llave foránea en `institutions`, la transacción garantiza que si el segundo paso falla, el registro del archivo se revierta para mantener limpia la BD. Se incluye un "fallback" a `file_format_id = 1` como medida de mitigación por si el tipo MIME del logo reportado por el cliente no existe en la tabla maestra de formatos.
 * @param instData {any} Metadatos descriptivos de la institución.
 * @param fileData {any} Datos del archivo del logo subido previamente al Storage.
 * @param accountId {number} ID de la cuenta que registra la institución (auditoría).
 * @return {Promise<Object>} El registro insertado de la institución enriquecido con la URL del logo.
 * @throws {Error} Lanza el error capturado tras ejecutar el `ROLLBACK` si alguna de las inserciones falla.
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function createInstitutionInDb(instData: any, fileData: any, accountId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

<<<<<<< HEAD
    // Paso A: Obtener el file_format_id basándonos en el mime_type (ej. image/png)
    // Nota: Asumimos que la tabla file_formats existe. Si no, usamos un ID por defecto (1).
    const formatRes = await client.query(`SELECT file_format_id FROM file_formats WHERE mime_type = $1 LIMIT 1`, [fileData.mime_type]);
    const fileFormatId = formatRes.rows.length > 0 ? formatRes.rows[0].file_format_id : 1;

    // Paso B: Insertar la referencia en aws_file_references
=======

    const formatRes = await client.query(`SELECT file_format_id FROM file_formats WHERE mime_type = $1 LIMIT 1`, [fileData.mime_type]);
    const fileFormatId = formatRes.rows.length > 0 ? formatRes.rows[0].file_format_id : 1;


>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
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

<<<<<<< HEAD
    // Paso C: Insertar la institución
=======

>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
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
<<<<<<< HEAD
      instData.access_level, // 'public' o 'internal'
      instData.institution_status // 'active' o 'inactive'
=======
      instData.access_level, 
      instData.institution_status 
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
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

<<<<<<< HEAD
// 3. Actualizar Institución (Transacción)
=======
/**
 * Descripción: Actualiza los datos de una institución, manejando condicionalmente la rotación de su logotipo.
 * POR QUÉ: Optimiza la operación evaluando la existencia del parámetro `fileData`. Si se proporciona una imagen nueva, ejecuta una transacción para insertar la nueva referencia de archivo y actualizar la FK (`logo_file_id`). Si no hay imagen nueva, muta la consulta SQL dinámicamente para actualizar únicamente los campos de texto, preservando la relación intacta con el logo anterior y ahorrando recursos transaccionales y de almacenamiento.
 * @param id {number} ID de la institución a modificar.
 * @param instData {any} Datos de texto actualizados.
 * @param fileData {any | null} Nuevos datos de imagen (opcional).
 * @param accountId {number} ID del usuario que ejecuta el cambio.
 * @return {Promise<Object>} La institución actualizada.
 * @throws {Error} Lanza error si la institución no existe (`rowCount === 0`) o si la transacción falla.
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function updateInstitutionInDb(id: number, instData: any, fileData: any, accountId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let newLogoFileId = null;

<<<<<<< HEAD
    // Si el usuario subió una imagen nueva, creamos el nuevo registro en aws_file_references
=======
   
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
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

<<<<<<< HEAD
    // Preparamos la actualización de la institución
=======
    
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
    let instQuery = "";
    let queryParams = [];

    if (newLogoFileId) {
<<<<<<< HEAD
      // Actualizamos TODO, incluyendo el nuevo logo
=======
      
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
      instQuery = `
        UPDATE institutions SET 
          legal_name = $1, short_name = $2, institution_type = $3, country_name = $4, 
          description = $5, data_role = $6, access_level = $7, institution_status = $8, 
          logo_file_id = $9, updated_at = NOW()
        WHERE institution_id = $10 RETURNING *
      `;
      queryParams = [instData.legal_name, instData.short_name, instData.institution_type, instData.country_name, instData.description, instData.data_role, instData.access_level, instData.institution_status, newLogoFileId, id];
    } else {
<<<<<<< HEAD
      // Actualizamos SOLO los textos (Mantiene el logo_file_id que ya tenía)
=======
      
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
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

<<<<<<< HEAD
// 4. Eliminar Institución
export async function deleteInstitutionFromDb(id: number) {
  // Nota: Por la regla ON DELETE RESTRICT, no borramos la imagen de aws_file_references, 
  // solo borramos la institución. La imagen quedará "huérfana" pero no romperá la BD.
=======
/**
 * Descripción: Elimina físicamente el registro de una institución.
 * POR QUÉ: Se ejecuta un "Hard Delete" únicamente sobre la tabla `institutions`. Debido a las políticas de integridad (`ON DELETE RESTRICT`), no se elimina el registro en `aws_file_references` de forma simultánea. Esta es una decisión de diseño para evitar fallos en cascada y bloqueos en la BD; el archivo huérfano queda en el Storage y BD para ser limpiado asíncronamente por una tarea programada (cron job) de mantenimiento en el futuro.
 * @param id {number} ID de la institución.
 * @return {Promise<number>} Cantidad de filas eliminadas (0 o 1).
 * @throws {Ninguna} Puede lanzar errores nativos de PostgreSQL si existen dependencias de clave foránea no resueltas (ej. Datasets asociados a esta institución).
 */
export async function deleteInstitutionFromDb(id: number) {
  
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  const query = `DELETE FROM institutions WHERE institution_id = $1`;
  const { rowCount } = await pool.query(query, [id]);
  return rowCount ?? 0;
}

<<<<<<< HEAD
// Obtiene instituciones públicas con paginación y búsqueda
=======
/**
 * Descripción: Recupera instituciones públicas y activas soportando búsqueda por texto y paginación a nivel de BD.
 * POR QUÉ: Separa la lógica en dos consultas independientes: un `COUNT(*)` para obtener el total absoluto y un `SELECT` con `LIMIT` y `OFFSET` para los datos. Esta es una optimización crítica para interfaces públicas paginadas, previniendo que el servidor node.js cargue y filtre cientos de registros en memoria RAM. El motor de búsqueda usa `ILIKE` para lograr coincidencias insensibles a mayúsculas construyendo la cláusula `WHERE` dinámicamente solo si hay un término de búsqueda.
 * @param search {string} Cadena de texto parcial para buscar en nombre legal, nombre corto o descripción.
 * @param limit {number} Cantidad máxima de registros por página.
 * @param offset {number} Cantidad de registros a saltar.
 * @return {Promise<Object>} Objeto estructurado con el `total` de coincidencias y el array de `data` paginada.
 * @throws {Ninguna}
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function fetchPublicInstitutionsPaginated(search: string, limit: number, offset: number) {
  let baseQuery = `
    FROM institutions i
    INNER JOIN aws_file_references afr ON i.logo_file_id = afr.aws_file_reference_id
    WHERE i.institution_status = 'active' AND i.access_level = 'public'
  `;
  
  const queryParams: any[] = [];
  
  if (search) {
    queryParams.push(`%${search}%`);
    baseQuery += ` AND (i.legal_name ILIKE $1 OR i.short_name ILIKE $1 OR i.description ILIKE $1)`;
  }

<<<<<<< HEAD
  // Contar el total para la paginación
=======

>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  const countQuery = `SELECT COUNT(*) ${baseQuery}`;
  const countRes = await pool.query(countQuery, queryParams);
  const total = parseInt(countRes.rows[0].count, 10);

<<<<<<< HEAD
  // Obtener los datos paginados
=======
  
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  queryParams.push(limit, offset);
  const dataQuery = `
    SELECT i.*, afr.storage_key, afr.file_url as logo_url 
    ${baseQuery}
    ORDER BY i.legal_name ASC
    LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
  `;
  
  const { rows } = await pool.query(dataQuery, queryParams);
  
  return { total, data: rows };
}