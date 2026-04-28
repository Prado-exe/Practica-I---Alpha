/**
 * ============================================================================
 * MÓDULO: Repositorio de Conjuntos de Datos (datasets.repository.ts)
 * * PROPÓSITO: Gestionar la persistencia de metadatos, archivos y auditoría de datasets.
 * * RESPONSABILIDAD: Ejecutar consultas y transacciones SQL complejas hacia PostgreSQL.
 * * ROL EN EL FLUJO DEL PROGRAMA: Actúa como la capa más profunda (Data Access Layer) 
 * para la gestión de datasets. Recibe datos validados y transformados desde el 
 * servicio (`datasets.service.ts`) y es el único autorizado para mutar el estado 
 * físico de las tablas `datasets`, `dataset_files`, `aws_file_references` y `dataset_events`.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Atomicidad Estricta: Se emplea control de transacciones manual (BEGIN/COMMIT/ROLLBACK) 
 * en operaciones de mutación múltiple. Se asume que la base de datos no debe almacenar 
 * un dataset si la vinculación de sus archivos físicos falla, y viceversa.
 * - Borrado Lógico (Soft Delete): Los datasets no se eliminan con la sentencia DELETE. 
 * Se actualiza su estado para preservar el historial estadístico y la integridad referencial.
 * ============================================================================
 */
import { pool } from "../config/db";

/**
 * Descripción: Crea un registro completo de dataset, inyecta sus referencias de archivos y registra su creación, todo bajo una única transacción.
 * POR QUÉ: Para la inserción de archivos, se implementan varios "workarounds" críticos:
 * 1. Sanitización de MIME Types: Sistemas operativos como Windows envían firmas como `application/x-zip-compressed` que rompen la validación estricta; aquí se normalizan.
 * 2. Fallback de Formatos: Si la extensión del archivo no coincide con las permitidas por el constraint de la BD, se fuerza a 'txt' para evitar un crash en la inserción.
 * 3. COALESCE en file_format_id: Evita errores de "null value" asignando un ID de formato por defecto si el MIME type proporcionado no existe en la tabla maestra `file_formats`.
 * @param {number} accountId ID de la cuenta del creador.
 * @param {boolean} isAdmin Flag que indica si el actor tiene privilegios administrativos.
 * @param {any} data Objeto con los metadatos del dataset y el arreglo de archivos validados.
 * @return {Promise<Object>} Un objeto conteniendo el `dataset_id` generado y el título.
 * @throws {Error} Lanza excepciones si la sintaxis SQL falla, si hay pérdida de conexión, provocando un ROLLBACK automático.
 */
export async function createFullDatasetInDb(accountId: number, isAdmin: boolean, data: any) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 👇 1. SE AGREGÓ ods_objective_id y $16
    const datasetQuery = `
      INSERT INTO datasets (
        owner_account_id, institution_id, category_id, license_id, ods_objective_id,
        title, summary, description, dataset_status, access_level,
        creation_date, geographic_coverage, update_frequency, 
        source_url, temporal_coverage_start, temporal_coverage_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING dataset_id
    `;
    
    const datasetRes = await client.query(datasetQuery, [
      accountId, 
      data.institution_id || null, 
      data.category_id, 
      data.license_id,
      data.ods_objective_id || null, 
      data.title, 
      data.summary, 
      data.description, 
      'draft', 
      data.access_level,
      data.creation_date, 
      data.geographic_coverage || null, 
      data.update_frequency || null,
      data.source_url || null, 
      data.temporal_coverage_start || null, 
      data.temporal_coverage_end || null
    ]);

    const dataset_id = datasetRes.rows[0].dataset_id;

    for (const file of data.files) {
      let safeMimeType = file.mime_type;
      if (safeMimeType === 'application/x-zip-compressed') safeMimeType = 'application/zip';
      if (safeMimeType === 'application/vnd.ms-excel') safeMimeType = 'text/csv'; 

      const ext = file.display_name.split('.').pop()?.toLowerCase();
      const allowedFormats = ['csv', 'json', 'xml', 'xlsx', 'pdf', 'zip', 'txt'];
      const finalFormat = allowedFormats.includes(ext) ? ext : 'txt'; 

      const fileRes = await client.query(`
        INSERT INTO aws_file_references (
          storage_key, file_url, file_format_id, file_size_bytes, mime_type, 
          file_category, owner_account_id, status
        ) VALUES (
          $1, $2, 
          COALESCE(
            (SELECT file_format_id FROM file_formats WHERE mime_type = $3 LIMIT 1),
            (SELECT file_format_id FROM file_formats LIMIT 1) 
          ), 
          $4, $3, $5, $6, 'active'
        )
        RETURNING aws_file_reference_id
      `, [file.storage_key, file.file_url, safeMimeType, file.file_size_bytes, 'dataset_source', accountId]);
      
      const aws_file_id = fileRes.rows[0].aws_file_reference_id;

      await client.query(`
        INSERT INTO dataset_files (
          dataset_id, aws_file_reference_id, file_role, display_name, file_format, mime_type, file_size_bytes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        dataset_id, aws_file_id, file.file_role || 'source', file.display_name, 
        finalFormat, safeMimeType, file.file_size_bytes
      ]);
    }

    if (data.tags && data.tags.length > 0) {
      for (const tagId of data.tags) {
        await client.query(`
          INSERT INTO dataset_tags (dataset_id, tag_id) VALUES ($1, $2)
        `, [dataset_id, tagId]);
      }
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
 * Descripción: Registra un evento de auditoría aislado para un dataset en el sistema.
 * POR QUÉ: Se desacopla esta función de las operaciones CRUD principales para permitir que procesos asíncronos o acciones secundarias (como descargas de usuarios anónimos) dejen un rastro forense sin necesidad de abrir transacciones complejas.
 * @param {any} eventData Objeto estructurado que contiene dataset_id, actor_account_id, event_type, event_result y event_comment.
 * @return {Promise<void>} Promesa vacía al completar la inserción.
 * @throws {Error} Si falla la conexión a la base de datos o se violan las llaves foráneas.
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

/**
 * Descripción: Recupera un listado paginado de datasets incluyendo soporte para búsquedas textuales.
 * POR QUÉ: Se opta por ejecutar dos consultas consecutivas (`COUNT` y luego el `SELECT` con `LIMIT/OFFSET`) en lugar de usar "window functions". Esto optimiza el uso de CPU en PostgreSQL al calcular el total absoluto necesario para renderizar los controles de paginación en el cliente, permitiendo a la vez extraer únicamente la porción de registros requerida.
 * @param {number} accountId ID del usuario solicitante (reservado para futuros filtros por ownership).
 * @param {boolean} isAdmin Flag para derivar vistas (reservado para saltar filtros restrictivos).
 * @param {string} search Término de búsqueda parcial para títulos y descripciones.
 * @param {number} limit Cantidad máxima de registros por página.
 * @param {number} offset Desplazamiento de registros para la paginación.
 * @return {Promise<Object>} Objeto estructurado `{ total: number, data: Array }`.
 * @throws {Error} Si ocurren problemas de conectividad con el pool de conexiones.
 */
export async function fetchDatasetsPaginated(accountId: number, isAdmin: boolean, search: string, limit: number, offset: number, filters: any = {}){
  let baseQuery = `
    FROM datasets d
    LEFT JOIN categories c ON d.category_id = c.category_id
    LEFT JOIN institutions i ON d.institution_id = i.institution_id
    LEFT JOIN licenses l ON d.license_id = l.license_id
    WHERE 1=1
  `;
  
  const queryParams: any[] = [];

  // 👇 LÓGICA DE SEGURIDAD Y PRIVACIDAD DE INSTITUCIONES 👇
  if (filters.isPublicCatalog) {
    baseQuery += ` AND d.dataset_status = 'published'`;
    
    if (accountId > 0) {
      // Usuario logueado
      baseQuery += ` AND d.access_level IN ('public', 'internal')`;
      
      if (!isAdmin) {
        // 🛡️ Filtro de Institución Privada: Si no es Admin, solo ve instituciones 'public',
        // o si es 'internal', debe pertenecer a ella (lo buscamos en la tabla accounts).
        baseQuery += ` AND (i.access_level = 'public' OR i.access_level IS NULL OR i.institution_id = (SELECT institution_id FROM accounts WHERE account_id = $${queryParams.length + 1}))`;
        queryParams.push(accountId);
      }
    } else {
      // Visitante anónimo: Se bloquea tanto el dataset interno como la institución interna
      baseQuery += ` AND d.access_level = 'public'`;
      baseQuery += ` AND (i.access_level = 'public' OR i.access_level IS NULL)`;
    }
  } else if (!isAdmin) {
    // Si es la vista de gestión privada y no es admin, solo ve sus propios registros
    baseQuery += ` AND d.owner_account_id = $${queryParams.length + 1}`;
    queryParams.push(accountId);
  }

  // --- FILTROS DINÁMICOS ---
  if (search) {
    queryParams.push(`%${search}%`);
    baseQuery += ` AND (d.title ILIKE $${queryParams.length} OR d.description ILIKE $${queryParams.length})`;
  }

  if (filters.categoria) {
    queryParams.push(filters.categoria);
    baseQuery += ` AND d.category_id = ANY(string_to_array($${queryParams.length}, ',')::integer[])`;
  }

  if (filters.ods) {
    queryParams.push(filters.ods);
    baseQuery += ` AND d.ods_objective_id = ANY(string_to_array($${queryParams.length}, ',')::smallint[])`;
  }

  if (filters.institucion) {
    queryParams.push(filters.institucion);
    baseQuery += ` AND d.institution_id = ANY(string_to_array($${queryParams.length}, ',')::integer[])`;
  }

  if (filters.estado) {
    queryParams.push(filters.estado);
    baseQuery += ` AND d.dataset_status = ANY(string_to_array($${queryParams.length}, ',')::varchar[])`;
  }

  if (filters.fecha) {
    queryParams.push(filters.fecha);
    baseQuery += ` AND d.created_at::date = $${queryParams.length}`;
  }

  if (filters.licencia) {
    queryParams.push(filters.licencia);
    baseQuery += ` AND d.license_id = ANY(string_to_array($${queryParams.length}, ',')::integer[])`;
  }

  if (filters.etiqueta) {
    queryParams.push(filters.etiqueta);
    baseQuery += ` AND EXISTS (
      SELECT 1 FROM dataset_tags dt
      WHERE dt.dataset_id = d.dataset_id
      AND dt.tag_id = ANY(string_to_array($${queryParams.length}, ',')::integer[])
    )`;
  }

  const countQuery = `SELECT COUNT(DISTINCT d.dataset_id) ${baseQuery}`;
  const countRes = await pool.query(countQuery, queryParams);
  const total = parseInt(countRes.rows[0].count, 10);

  queryParams.push(limit, offset);
  
  const dataQuery = `
    SELECT 
      d.dataset_id, 
      d.title as nombre, 
      d.description, 
      c.name as categoria, 
      i.legal_name as institucion, 
      TO_CHAR(d.created_at, 'YYYY-MM-DD') as fecha, 
      d.dataset_status,
      d.access_level
    ${baseQuery}
    ORDER BY d.created_at DESC
    LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
  `;
  
  const { rows } = await pool.query(dataQuery, queryParams);
  return { total, data: rows };
}

/**
 * Descripción: Extrae el grafo completo de información de un dataset, combinando metadatos, archivos físicos y trazabilidad.
 * POR QUÉ: Para evitar un Producto Cartesiano ineficiente (que multiplicaría filas al hacer JOIN con múltiples tablas de relación uno a muchos), se divide estratégicamente en tres consultas secuenciales independientes. El objeto resultante se ensambla en la memoria de Node.js, lo que resulta mucho más ligero y veloz para la base de datos.
 * @param {number} id Identificador único del dataset.
 * @return {Promise<Object | null>} Objeto con el modelo del dataset inyectando arreglos en `files` y `events`, o null si no existe.
 * @throws {Error} Excepciones generadas por fallos en el motor de base de datos.
 */
export async function fetchDatasetDetailsFromDb(id: number) {
  // A. Metadatos principales (Se agrega i.access_level)
  const dsRes = await pool.query(`
    SELECT d.*, c.name as category_name, i.legal_name as institution_name, l.name as license_name,
           o.objective_code, o.objective_name,
           i.access_level AS institution_access_level  
    FROM datasets d 
    LEFT JOIN categories c ON d.category_id = c.category_id
    LEFT JOIN institutions i ON d.institution_id = i.institution_id
    LEFT JOIN licenses l ON d.license_id = l.license_id
    LEFT JOIN ods_objectives o ON d.ods_objective_id = o.ods_objective_id
    WHERE d.dataset_id = $1
  `, [id]);
  
  if (dsRes.rowCount === 0) return null;
  const dataset = dsRes.rows[0];

  // B. Archivos actuales
  const filesRes = await pool.query(`
    SELECT afr.aws_file_reference_id, df.display_name, afr.file_url, afr.storage_key, afr.mime_type, afr.file_size_bytes
    FROM aws_file_references afr
    INNER JOIN dataset_files df ON afr.aws_file_reference_id = df.aws_file_reference_id
    WHERE df.dataset_id = $1 AND df.is_pending_validation = FALSE
  `, [id]);
  dataset.files = filesRes.rows;

  // C. Etiquetas actuales
  const tagsRes = await pool.query(`
    SELECT t.tag_id, t.name FROM dataset_tags dt
    INNER JOIN tags t ON dt.tag_id = t.tag_id
    WHERE dt.dataset_id = $1
  `, [id]);
  dataset.tags = tagsRes.rows;

  const reqRes = await pool.query(`
    SELECT dr.*, acc.full_name as requester_name
    FROM dataset_requests dr
    LEFT JOIN accounts acc ON dr.requester_account_id = acc.account_id
    WHERE dr.dataset_id = $1 AND dr.request_status = 'pending'
    LIMIT 1
  `, [id]);

  if (reqRes.rowCount && reqRes.rowCount > 0) {
    const request = reqRes.rows[0];
    if (request.request_type === 'edit' && request.pending_changes) {
      const pc = request.pending_changes;
      const [cat, lic, inst, ods] = await Promise.all([
        pool.query('SELECT name FROM categories WHERE category_id = $1', [pc.category_id]),
        pool.query('SELECT name FROM licenses WHERE license_id = $1', [pc.license_id]),
        pool.query('SELECT legal_name FROM institutions WHERE institution_id = $1', [pc.institution_id]),
        pool.query('SELECT objective_name FROM ods_objectives WHERE ods_objective_id = $1', [pc.ods_objective_id])
      ]);
      const tags = await pool.query('SELECT name FROM tags WHERE tag_id = ANY($1::int[])', [pc.tags || []]);

      request.resolved_changes = {
        ...pc,
        category_name: cat.rows[0]?.name || "N/A",
        license_name: lic.rows[0]?.name || "N/A",
        institution_name: inst.rows[0]?.legal_name || "N/A",
        ods_name: ods.rows[0]?.objective_name || "N/A",
        tag_names: tags.rows.map(t => t.name)
      };

      const pendingFilesRes = await pool.query(`
        SELECT afr.aws_file_reference_id, df.display_name, afr.file_url, afr.storage_key, afr.mime_type, afr.file_size_bytes
        FROM aws_file_references afr
        INNER JOIN dataset_files df ON afr.aws_file_reference_id = df.aws_file_reference_id
        WHERE df.dataset_id = $1 AND df.is_pending_validation = TRUE
      `, [id]);
      request.new_files_info = pendingFilesRes.rows;
    }
    dataset.pending_request = request;
  }
  return dataset;
}

/**
 * Descripción: Archiva un dataset (lo oculta del público) sin borrar sus archivos físicos.
 */
export async function archiveDatasetInDb(datasetId: number, accountId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Actualizamos el estado del dataset a 'archived'
    const updateQuery = `
      UPDATE datasets 
      SET dataset_status = 'archived', updated_at = NOW()
      WHERE dataset_id = $1 AND dataset_status != 'archived'
      RETURNING dataset_id, title
    `;
    const res = await client.query(updateQuery, [datasetId]);
    
    if (res.rowCount === 0) throw new Error("Dataset no encontrado o ya archivado");

    // 2. Registramos el evento de auditoría
    await client.query(`
      INSERT INTO dataset_events (dataset_id, actor_account_id, event_type, event_result, event_comment)
      VALUES ($1, $2, 'archived', 'success', 'Dataset archivado (oculto al público)')
    `, [datasetId, accountId]);

    await client.query('COMMIT');
    return { dataset: res.rows[0] };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Descripción: Modifica los metadatos core de un dataset existente.
 * POR QUÉ: La operación está encapsulada en una transacción para que el cambio de datos y la traza de auditoría (`edited`) se asienten simultáneamente. No manipula las relaciones de archivos, las cuales operan bajo su propio ciclo de vida independiente. Se utiliza `RETURNING *` para devolver el modelo actualizado de forma inmediata sin emitir un segundo `SELECT`.
 * @param {number} datasetId ID del dataset a editar.
 * @param {number} accountId ID de la cuenta que solicita la edición (para auditoría).
 * @param {any} data Nuevo estado de los metadatos.
 * @return {Promise<Object>} Objeto completo del dataset post-actualización.
 * @throws {Error} Si el dataset no se encuentra o la actualización falla por reglas de integridad.
 */
/**
 * Modifica los metadatos core de un dataset y gestiona la adición/eliminación de archivos.
 */
export async function updateDatasetInDb(datasetId: number, accountId: number, data: any) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. ACTUALIZAR METADATOS (Tu código original)
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

    // 2. INSERTAR NUEVOS ARCHIVOS (Misma lógica que al crear)
    if (data.new_files && data.new_files.length > 0) {
      for (const file of data.new_files) {
        let safeMimeType = file.mime_type;
        if (safeMimeType === 'application/x-zip-compressed') safeMimeType = 'application/zip';
        if (safeMimeType === 'application/vnd.ms-excel') safeMimeType = 'text/csv';

        const ext = file.display_name.split('.').pop()?.toLowerCase();
        const allowedFormats = ['csv', 'json', 'xml', 'xlsx', 'pdf', 'zip', 'txt'];
        const finalFormat = allowedFormats.includes(ext) ? ext : 'txt';

        const fileRes = await client.query(`
          INSERT INTO aws_file_references (
            storage_key, file_url, file_format_id, file_size_bytes, mime_type, 
            file_category, owner_account_id, status
          ) VALUES (
            $1, $2, COALESCE((SELECT file_format_id FROM file_formats WHERE mime_type = $3 LIMIT 1), 1), 
            $4, $3, 'dataset_source', $5, 'active'
          ) RETURNING aws_file_reference_id
        `, [file.storage_key, file.file_url, safeMimeType, file.file_size_bytes, accountId]);
        
        const aws_file_id = fileRes.rows[0].aws_file_reference_id;

        await client.query(`
          INSERT INTO dataset_files (
            dataset_id, aws_file_reference_id, file_role, display_name, file_format, mime_type, file_size_bytes
          ) VALUES ($1, $2, 'source', $3, $4, $5, $6)
        `, [datasetId, aws_file_id, file.display_name, finalFormat, safeMimeType, file.file_size_bytes]);
      }
    }

    // 3. ELIMINAR ARCHIVOS VIEJOS
    let s3KeysToDelete = [];
    if (data.deleted_file_ids && data.deleted_file_ids.length > 0) {
      // Guardar las S3 Keys antes de borrar el registro para dárselas a MinIO
      const keysRes = await client.query(`
        SELECT storage_key FROM aws_file_references WHERE aws_file_reference_id = ANY($1::bigint[])
      `, [data.deleted_file_ids]);
      s3KeysToDelete = keysRes.rows.map(r => r.storage_key);

      // Borrar de la base de datos
      await client.query(`DELETE FROM dataset_files WHERE aws_file_reference_id = ANY($1::bigint[])`, [data.deleted_file_ids]);
      await client.query(`DELETE FROM aws_file_references WHERE aws_file_reference_id = ANY($1::bigint[])`, [data.deleted_file_ids]);
    }

    // 4. EVENTO FORENSE
    await client.query(`
      INSERT INTO dataset_events (dataset_id, actor_account_id, event_type, event_result, event_comment)
      VALUES ($1, $2, 'edited', 'success', 'Metadatos y/o archivos del dataset actualizados')
    `, [datasetId, accountId]);

    await client.query('COMMIT');
    
    // Devolvemos el dataset y las llaves que el servicio debe destruir en MinIO
    return { updatedDataset: res.rows[0], s3KeysToDelete };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}


/**
 * Crea un dataset generado por un usuario.
 * Si es 'pending_validation', genera la solicitud formal. Si es 'draft', solo lo guarda.
 */
export async function createDatasetRequestInDb(accountId: number, data: any) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insertar Dataset usando el estado dinámico (draft o pending_validation)
    const datasetRes = await client.query(`
      INSERT INTO datasets (
        owner_account_id, institution_id, category_id, license_id, 
        title, summary, description, dataset_status, access_level,
        creation_date, geographic_coverage, update_frequency, 
        source_url, temporal_coverage_start, temporal_coverage_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING dataset_id
    `, [
      accountId, data.institution_id || null, data.category_id, data.license_id,
      data.title, data.summary, data.description, data.dataset_status, data.access_level,
      data.creation_date, data.geographic_coverage || null, data.update_frequency || null,
      data.source_url || null, data.temporal_coverage_start || null, data.temporal_coverage_end || null
    ]);
    const dataset_id = datasetRes.rows[0].dataset_id;

    // 2. Insertar Archivos
    for (const file of data.files) {
      let safeMimeType = file.mime_type;
      if (safeMimeType === 'application/x-zip-compressed') safeMimeType = 'application/zip';
      if (safeMimeType === 'application/vnd.ms-excel') safeMimeType = 'text/csv';

      const ext = file.display_name.split('.').pop()?.toLowerCase();
      const allowedFormats = ['csv', 'json', 'xml', 'xlsx', 'pdf', 'zip', 'txt'];
      const finalFormat = allowedFormats.includes(ext) ? ext : 'txt';

      const fileRes = await client.query(`
        INSERT INTO aws_file_references (
          storage_key, file_url, file_format_id, file_size_bytes, mime_type, 
          file_category, owner_account_id, status
        ) VALUES (
          $1, $2, 
          COALESCE(
            (SELECT file_format_id FROM file_formats WHERE mime_type = $3 LIMIT 1),
            (SELECT file_format_id FROM file_formats LIMIT 1)
          ), 
          $4, $3, $5, $6, 'active'
        ) RETURNING aws_file_reference_id
      `, [file.storage_key, file.file_url, safeMimeType, file.file_size_bytes, 'dataset_source', accountId]);
      
      const aws_file_id = fileRes.rows[0].aws_file_reference_id;

      await client.query(`
        INSERT INTO dataset_files (
          dataset_id, aws_file_reference_id, file_role, display_name, file_format, mime_type, file_size_bytes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [dataset_id, aws_file_id, file.file_role || 'source', file.display_name, finalFormat, safeMimeType, file.file_size_bytes]);
    }

    // CORRECCIÓN: INSERTAR LAS ETIQUETAS EN LA BD
    if (data.tags && data.tags.length > 0) {
      for (const tagId of data.tags) {
        await client.query(`
          INSERT INTO dataset_tags (dataset_id, tag_id) VALUES ($1, $2)
        `, [dataset_id, tagId]);
      }
    }

    // 3. Lógica Condicional: ¿Borrador o Petición de Validación?
    if (data.dataset_status === 'pending_validation') {
      // Se genera la solicitud para el admin
      await client.query(`
        INSERT INTO dataset_requests (dataset_id, requester_account_id, request_type, request_status, message)
        VALUES ($1, $2, 'create', 'pending', $3)
      `, [dataset_id, accountId, data.message]);

      await client.query(`
        INSERT INTO dataset_events (dataset_id, actor_account_id, event_type, event_result, event_comment)
        VALUES ($1, $2, 'submitted_for_validation', 'success', 'El usuario ha enviado el dataset para revisión administrativa.')
      `, [dataset_id, accountId]);
    } else {
      // Es un borrador silencioso (draft)
      await client.query(`
        INSERT INTO dataset_events (dataset_id, actor_account_id, event_type, event_result, event_comment)
        VALUES ($1, $2, 'created', 'success', 'Dataset guardado como borrador personal.')
      `, [dataset_id, accountId]);
    }

    await client.query('COMMIT');
    return { dataset_id, title: data.title, status: data.dataset_status };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}


/**
 * Resuelve una solicitud de dataset (Aprobar o Rechazar).
 * Lee el request_type para saber exactamente qué acción aplicar sobre la base de datos.
 */
export async function resolveDatasetRequestInDb(datasetId: number, adminAccountId: number, action: 'publish' | 'reject', reviewComment: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Buscar la solicitud pendiente y su tipo
    const reqRes = await client.query(
      `SELECT request_type, pending_changes FROM dataset_requests WHERE dataset_id = $1 AND request_status = 'pending'`,
      [datasetId]
    );
    
    if (reqRes.rowCount === 0) {
      throw new Error("No hay solicitudes pendientes de revisión para este dataset.");
    }
    
    const { request_type, pending_changes } = reqRes.rows[0];
    let s3KeysToDelete: string[] = [];
    let isHardDeleted = false;

    // ==========================================
    // ESCENARIO A: RECHAZAR SOLICITUD
    // ==========================================
    if (action === 'reject') {
      if (request_type === 'create') {
        // Rechazo de Creación -> HARD DELETE (Opción B)
        const filesRes = await client.query(`
          SELECT afr.aws_file_reference_id, afr.storage_key
          FROM dataset_files df
          INNER JOIN aws_file_references afr ON df.aws_file_reference_id = afr.aws_file_reference_id
          WHERE df.dataset_id = $1
        `, [datasetId]);
        
        s3KeysToDelete = filesRes.rows.map(r => r.storage_key);
        const fileIds = filesRes.rows.map(r => r.aws_file_reference_id);

        // El CASCADE borrará el dataset, dataset_requests, dataset_events y dataset_tags
        await client.query(`DELETE FROM datasets WHERE dataset_id = $1`, [datasetId]);

        // Limpiar los registros huérfanos de archivos
        if (fileIds.length > 0) {
          await client.query(`DELETE FROM aws_file_references WHERE aws_file_reference_id = ANY($1::bigint[])`, [fileIds]);
        }
        isHardDeleted = true;
      } 
      else if (request_type === 'edit') {
        // Rechazo de Edición -> Borrar solo los archivos NUEVOS que estaban esperando
        const newFilesRes = await client.query(`
          SELECT afr.aws_file_reference_id, afr.storage_key
          FROM dataset_files df
          INNER JOIN aws_file_references afr ON df.aws_file_reference_id = afr.aws_file_reference_id
          WHERE df.dataset_id = $1 AND df.is_pending_validation = TRUE
        `, [datasetId]);
        
        s3KeysToDelete = newFilesRes.rows.map(r => r.storage_key);
        const fileIds = newFilesRes.rows.map(r => r.aws_file_reference_id);

        if (fileIds.length > 0) {
          await client.query(`DELETE FROM dataset_files WHERE aws_file_reference_id = ANY($1::bigint[])`, [fileIds]);
          await client.query(`DELETE FROM aws_file_references WHERE aws_file_reference_id = ANY($1::bigint[])`, [fileIds]);
        }

        // Actualizar ticket
        await client.query(`
          UPDATE dataset_requests SET request_status = 'rejected', review_comment = $1, claimed_by_admin_account_id = $2, updated_at = NOW(), claimed_at = NOW()
          WHERE dataset_id = $3 AND request_status = 'pending'
        `, [reviewComment, adminAccountId, datasetId]);

        await client.query(`
          INSERT INTO dataset_events (dataset_id, actor_account_id, event_type, event_result, event_comment)
          VALUES ($1, $2, 'rejected', 'success', $3)
        `, [datasetId, adminAccountId, `Edición rechazada. Comentario: ${reviewComment}`]);
      }
      else if (request_type === 'archive') {
        // Rechazo de Archivado -> Queda público
        await client.query(`
          UPDATE dataset_requests SET request_status = 'rejected', review_comment = $1, claimed_by_admin_account_id = $2, updated_at = NOW(), claimed_at = NOW()
          WHERE dataset_id = $3 AND request_status = 'pending'
        `, [reviewComment, adminAccountId, datasetId]);

        await client.query(`
          INSERT INTO dataset_events (dataset_id, actor_account_id, event_type, event_result, event_comment)
          VALUES ($1, $2, 'rejected', 'success', $3)
        `, [datasetId, adminAccountId, `Archivado rechazado. Comentario: ${reviewComment}`]);
      }
    } 
    // ==========================================
    // ESCENARIO B: APROBAR SOLICITUD ('publish')
    // ==========================================
    else if (action === 'publish') {
      if (request_type === 'destroy') {
    // 1. Obtener información de archivos para retorno (para que el servicio limpie S3)
    const filesRes = await client.query(`
      SELECT afr.storage_key, afr.aws_file_reference_id
      FROM dataset_files df
      INNER JOIN aws_file_references afr ON df.aws_file_reference_id = afr.aws_file_reference_id
      WHERE df.dataset_id = $1
    `, [datasetId]);
    
    s3KeysToDelete = filesRes.rows.map(r => r.storage_key);
    const fileIds = filesRes.rows.map(r => r.aws_file_reference_id);

    // 2. Borrado Nuclear: El CASCADE se encarga de tablas hijas, pero borramos referencias maestras de archivos
    await client.query(`DELETE FROM datasets WHERE dataset_id = $1`, [datasetId]);
    if (fileIds.length > 0) {
      await client.query(`DELETE FROM aws_file_references WHERE aws_file_reference_id = ANY($1::bigint[])`, [fileIds]);
    }
    
    isHardDeleted = true; // Flag para retornar el mensaje correcto
  }

      if (request_type === 'create') {
        await client.query(`UPDATE datasets SET dataset_status = 'published', published_at = NOW(), updated_at = NOW() WHERE dataset_id = $1`, [datasetId]);
      }
      else if (request_type === 'edit') {
        const data = pending_changes;
        
        // 1. Aplicar metadatos al dataset original
        await client.query(`
          UPDATE datasets SET 
            title = $1, category_id = $2, license_id = $3, institution_id = $4,
            summary = $5, description = $6, access_level = $7,
            creation_date = $8, geographic_coverage = $9, update_frequency = $10, 
            source_url = $11, temporal_coverage_start = $12, temporal_coverage_end = $13,
            ods_objective_id = $14, updated_at = NOW()
          WHERE dataset_id = $15
        `, [
          data.title, data.category_id, data.license_id, data.institution_id || null,
          data.summary, data.description, data.access_level,
          data.creation_date, data.geographic_coverage || null, data.update_frequency || null,
          data.source_url || null, data.temporal_coverage_start || null, data.temporal_coverage_end || null,
          data.ods_objective_id || null, datasetId
        ]);

        // 2. Reemplazar Etiquetas (Tags)
        if (data.tags && Array.isArray(data.tags)) {
          await client.query(`DELETE FROM dataset_tags WHERE dataset_id = $1`, [datasetId]);
          for (const tagId of data.tags) {
            await client.query(`INSERT INTO dataset_tags (dataset_id, tag_id) VALUES ($1, $2)`, [datasetId, tagId]);
          }
        }

        // 3. Activar archivos nuevos quitando el booleano
        await client.query(`
          UPDATE dataset_files SET is_pending_validation = FALSE 
          WHERE dataset_id = $1 AND is_pending_validation = TRUE
        `, [datasetId]);

        // 4. Recolectar llaves y eliminar en BD los archivos que el usuario pidió borrar
        if (data.deleted_file_ids && data.deleted_file_ids.length > 0) {
          const keysRes = await client.query(`SELECT storage_key FROM aws_file_references WHERE aws_file_reference_id = ANY($1::bigint[])`, [data.deleted_file_ids]);
          s3KeysToDelete = keysRes.rows.map(r => r.storage_key);
          
          await client.query(`DELETE FROM dataset_files WHERE aws_file_reference_id = ANY($1::bigint[])`, [data.deleted_file_ids]);
          await client.query(`DELETE FROM aws_file_references WHERE aws_file_reference_id = ANY($1::bigint[])`, [data.deleted_file_ids]);
        }
      }
      else if (request_type === 'archive') {
        await client.query(`UPDATE datasets SET dataset_status = 'archived', updated_at = NOW() WHERE dataset_id = $1`, [datasetId]);
      }

      // Actualizar el ticket a Aprobado
      await client.query(`
        UPDATE dataset_requests SET request_status = 'approved', review_comment = $1, claimed_by_admin_account_id = $2, updated_at = NOW(), claimed_at = NOW()
        WHERE dataset_id = $3 AND request_status = 'pending'
      `, [reviewComment, adminAccountId, datasetId]);

      // CORRECCIÓN DEL EVENT_TYPE PARA EVITAR ERROR 500 EN LA TABLA dataset_events
      let eventTypeStr = 'published';
      if (request_type === 'edit') eventTypeStr = 'updated';
      if (request_type === 'archive') eventTypeStr = 'archived';

      await client.query(`
        INSERT INTO dataset_events (dataset_id, actor_account_id, event_type, event_result, event_comment)
        VALUES ($1, $2, $3, 'success', $4)
      `, [datasetId, adminAccountId, eventTypeStr, `Solicitud aprobada. Comentario: ${reviewComment}`]);
    }

    await client.query('COMMIT');
    return { 
      message: isHardDeleted ? "Dataset rechazado y destruido correctamente." : "Solicitud resuelta y aplicada correctamente.",
      s3KeysToDelete,
      isHardDeleted
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Descripción: Elimina físicamente un dataset y todas sus dependencias de la base de datos.
 * Extrae las referencias S3 antes de borrar para permitir la limpieza en la nube.
 */
export async function hardDeleteDatasetInDb(datasetId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Obtener archivos para borrarlos de S3 y limpiar la tabla maestra de archivos
    const filesQuery = `
      SELECT afr.aws_file_reference_id, afr.storage_key
      FROM dataset_files df
      INNER JOIN aws_file_references afr ON df.aws_file_reference_id = afr.aws_file_reference_id
      WHERE df.dataset_id = $1
    `;
    const filesRes = await client.query(filesQuery, [datasetId]);
    const filesToDelete = filesRes.rows;

    // 2. Obtener título para el mensaje de retorno
    const dsRes = await client.query(`SELECT title FROM datasets WHERE dataset_id = $1`, [datasetId]);
    if (dsRes.rowCount === 0) throw new Error("Dataset no encontrado");
    const title = dsRes.rows[0].title;

    // 3. Destrucción Nuclear del Dataset (El CASCADE borra dataset_events, dataset_requests y dataset_files)
    await client.query(`DELETE FROM datasets WHERE dataset_id = $1`, [datasetId]);

    // 4. Limpiar los registros huérfanos de los archivos maestros
    if (filesToDelete.length > 0) {
      const fileIds = filesToDelete.map(f => f.aws_file_reference_id);
      await client.query(`
        DELETE FROM aws_file_references 
        WHERE aws_file_reference_id = ANY($1::bigint[])
      `, [fileIds]);
    }

    await client.query('COMMIT');
    return { title, filesToDelete };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Descripción: Revierte el estado de archivado de un dataset, volviéndolo a publicar.
 */
export async function unarchiveDatasetInDb(datasetId: number, accountId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const updateQuery = `
      UPDATE datasets 
      SET dataset_status = 'published', updated_at = NOW()
      WHERE dataset_id = $1 AND dataset_status = 'archived'
      RETURNING dataset_id, title
    `;
    const res = await client.query(updateQuery, [datasetId]);
    
    if (res.rowCount === 0) throw new Error("Dataset no encontrado o no está archivado");

    await client.query(`
      INSERT INTO dataset_events (dataset_id, actor_account_id, event_type, event_result, event_comment)
      VALUES ($1, $2, 'published', 'success', 'Dataset restaurado: vuelve a ser visible al público')
    `, [datasetId, accountId]);

    await client.query('COMMIT');
    return { dataset: res.rows[0] };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function fetchDashboardStats() {
  const [statsRes, usersRes, categoryRes, statusRes, latestRes, pendingRes, activityRes] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE dataset_status != 'deleted') AS total,
        COUNT(*) FILTER (WHERE dataset_status = 'published')           AS published,
        COUNT(*) FILTER (WHERE dataset_status = 'pending_validation')  AS pending_validation,
        COUNT(*) FILTER (WHERE dataset_status = 'rejected')            AS rejected,
        COUNT(*) FILTER (WHERE dataset_status = 'draft')               AS draft
      FROM datasets
    `),
    pool.query(`SELECT COUNT(*) AS total FROM accounts`),
    pool.query(`
      SELECT COALESCE(c.name, 'Sin categoría') AS name, COUNT(d.dataset_id) AS value
      FROM datasets d
      LEFT JOIN categories c ON d.category_id = c.category_id
      WHERE d.dataset_status != 'deleted'
      GROUP BY c.name
      ORDER BY value DESC
      LIMIT 8
    `),
    pool.query(`
      SELECT dataset_status AS name, COUNT(*) AS value
      FROM datasets
      WHERE dataset_status != 'deleted'
      GROUP BY dataset_status
      ORDER BY value DESC
    `),
    pool.query(`
      SELECT d.dataset_id, d.title, COALESCE(i.legal_name, '—') AS institucion,
             TO_CHAR(d.created_at, 'DD-MM-YYYY') AS fecha, d.dataset_status
      FROM datasets d
      LEFT JOIN institutions i ON d.institution_id = i.institution_id
      WHERE d.dataset_status != 'deleted'
      ORDER BY d.created_at DESC
      LIMIT 6
    `),
    pool.query(`
      SELECT d.dataset_id, d.title, COALESCE(i.legal_name, '—') AS institucion,
             TO_CHAR(d.created_at, 'DD-MM-YYYY') AS fecha
      FROM datasets d
      LEFT JOIN institutions i ON d.institution_id = i.institution_id
      WHERE d.dataset_status = 'pending_validation'
      ORDER BY d.created_at ASC
      LIMIT 6
    `),
    pool.query(`
      SELECT de.event_type, de.event_result,
             TO_CHAR(de.created_at, 'DD-MM-YYYY HH24:MI') AS fecha,
             COALESCE(acc.full_name, 'Sistema') AS usuario,
             COALESCE(r.code, '—') AS rol
      FROM dataset_events de
      LEFT JOIN accounts acc ON de.actor_account_id = acc.account_id
      LEFT JOIN roles r ON acc.role_id = r.role_id
      ORDER BY de.created_at DESC
      LIMIT 6
    `)
  ]);

  const ds = statsRes.rows[0];
  return {
    stats: {
      total:      parseInt(ds.total, 10),
      publicados: parseInt(ds.published, 10),
      validacion: parseInt(ds.pending_validation, 10),
      rechazados: parseInt(ds.rejected, 10),
      borradores: parseInt(ds.draft, 10),
      usuarios:   parseInt(usersRes.rows[0].total, 10),
    },
    byCategory:         categoryRes.rows.map(r => ({ name: r.name,  value: parseInt(r.value, 10) })),
    byStatus:           statusRes.rows.map(r =>   ({ name: r.name,  value: parseInt(r.value, 10) })),
    latestDatasets:     latestRes.rows,
    pendingValidations: pendingRes.rows,
    recentActivity:     activityRes.rows,
  };
}


/**
 * Crea una solicitud de ARCHIVADO (Soft Delete).
 */
export async function createArchiveRequestInDb(datasetId: number, accountId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Solución al error TS18047
    const checkRes = await client.query(
      `SELECT 1 FROM dataset_requests WHERE dataset_id = $1 AND request_status = 'pending'`,
      [datasetId]
    );
    if ((checkRes.rowCount ?? 0) > 0) {
      throw new Error("Ya existe una solicitud pendiente de revisión para este dataset.");
    }

    await client.query(`
      INSERT INTO dataset_requests (dataset_id, requester_account_id, request_type, request_status)
      VALUES ($1, $2, 'archive', 'pending')
    `, [datasetId, accountId]);

    await client.query(`
      INSERT INTO dataset_events (dataset_id, actor_account_id, event_type, event_result, event_comment)
      VALUES ($1, $2, 'archive_requested', 'success', 'El usuario solicitó dar de baja el dataset. En espera de validación.')
    `, [datasetId, accountId]);

    await client.query('COMMIT');
    return { message: "Solicitud de archivado enviada a los administradores." };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Función auxiliar para procesar e insertar archivos nuevos en estado "Pendiente".
 * Se ejecuta dentro de la transacción padre usando el mismo `client`.
 */
export async function insertPendingFilesInDb(client: any, datasetId: number, accountId: number, newFiles: any[]) {
  for (const file of newFiles) {
    let safeMimeType = file.mime_type;
    // Sanitización básica para firmas de SO
    if (safeMimeType === 'application/x-zip-compressed') safeMimeType = 'application/zip';
    if (safeMimeType === 'application/vnd.ms-excel') safeMimeType = 'text/csv';

    const ext = file.display_name.split('.').pop()?.toLowerCase();
    const allowedFormats = ['csv', 'json', 'xml', 'xlsx', 'pdf', 'zip', 'txt'];
    const finalFormat = allowedFormats.includes(ext) ? ext : 'txt';

    // 1. Insertar referencia física (aws_file_references)
    const fileRes = await client.query(`
      INSERT INTO aws_file_references (
        storage_key, file_url, file_format_id, file_size_bytes, mime_type, 
        file_category, owner_account_id, status
      ) VALUES (
        $1, $2, COALESCE((SELECT file_format_id FROM file_formats WHERE mime_type = $3 LIMIT 1), 1), 
        $4, $3, 'dataset_source', $5, 'active'
      ) RETURNING aws_file_reference_id
    `, [file.storage_key, file.file_url, safeMimeType, file.file_size_bytes, accountId]);
    
    const aws_file_id = fileRes.rows[0].aws_file_reference_id;

    // 2. Insertar relación con dataset marcada como PENDIENTE (is_pending_validation = TRUE)
    await client.query(`
      INSERT INTO dataset_files (
        dataset_id, aws_file_reference_id, file_role, display_name, file_format, 
        mime_type, file_size_bytes, is_pending_validation
      ) VALUES ($1, $2, 'source', $3, $4, $5, $6, TRUE)
    `, [datasetId, aws_file_id, file.display_name, finalFormat, safeMimeType, file.file_size_bytes]);
  }
}

/**
 * Crea una solicitud de EDICIÓN, guardando los metadatos en el JSONB `pending_changes`.
 * Delega la inserción de archivos a `insertPendingFilesInDb`.
 */
export async function createEditRequestInDb(datasetId: number, accountId: number, pendingChanges: any) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Bloqueo de múltiples ediciones
    const checkRes = await client.query(
      `SELECT 1 FROM dataset_requests WHERE dataset_id = $1 AND request_status = 'pending'`,
      [datasetId]
    );
    if ((checkRes.rowCount ?? 0) > 0) {
      throw new Error("Ya existe una solicitud pendiente de revisión para este dataset.");
    }

    // 2. Insertar el ticket con el JSONB
    await client.query(`
      INSERT INTO dataset_requests (dataset_id, requester_account_id, request_type, request_status, pending_changes)
      VALUES ($1, $2, 'edit', 'pending', $3)
    `, [datasetId, accountId, JSON.stringify(pendingChanges)]);

    // 3. Procesar archivos nuevos (si existen) usando la función auxiliar
    if (pendingChanges.new_files && pendingChanges.new_files.length > 0) {
      await insertPendingFilesInDb(client, datasetId, accountId, pendingChanges.new_files);
    }

    // 4. Registrar evento forense
    await client.query(`
      INSERT INTO dataset_events (dataset_id, actor_account_id, event_type, event_result, event_comment)
      VALUES ($1, $2, 'submitted_for_validation', 'success', 'El usuario solicitó editar el dataset. En espera de validación.')
    `, [datasetId, accountId]);

    await client.query('COMMIT');
    return { message: "Solicitud de edición enviada a los administradores." };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Recupera los datasets donde el usuario es el propietario O pertenecen a su institución.
 * Filtra los datasets que han sido eliminados físicamente.
 */
export async function fetchUserAndInstitutionDatasetsFromDb(accountId: number, institutionId: number | null) {
  const query = `
    SELECT 
      d.dataset_id AS id, 
      d.title AS nombre, 
      c.name AS categoria, 
      i.legal_name AS institucion, 
      TO_CHAR(d.created_at, 'YYYY-MM-DD') AS fecha, 
      d.dataset_status
    FROM datasets d
    LEFT JOIN categories c ON d.category_id = c.category_id  -- 👈 CAMBIADO A LEFT JOIN
    LEFT JOIN institutions i ON d.institution_id = i.institution_id
    WHERE (d.owner_account_id = $1 
       OR (d.institution_id IS NOT NULL AND d.institution_id = $2))
       AND d.dataset_status != 'deleted'
    ORDER BY d.created_at DESC
  `;
  const { rows } = await pool.query(query, [accountId, institutionId]);
  return rows;
}

/**
 * Crea una solicitud formal para destruir permanentemente un dataset.
 * Solo se permite si no hay otras solicitudes pendientes.
 */
export async function createDestroyRequestInDb(datasetId: number, accountId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verificar si ya existe una solicitud pendiente de cualquier tipo
    const checkRes = await client.query(
      `SELECT 1 FROM dataset_requests WHERE dataset_id = $1 AND request_status = 'pending'`,
      [datasetId]
    );
    if ((checkRes.rowCount ?? 0) > 0) {
      throw new Error("Ya existe una solicitud pendiente de revisión para este dataset.");
    }

    // 2. Insertar el ticket de tipo 'destroy'
    await client.query(`
      INSERT INTO dataset_requests (dataset_id, requester_account_id, request_type, request_status, message)
      VALUES ($1, $2, 'destroy', 'pending', 'Solicitud del usuario para eliminación permanente del dataset y sus archivos.')
    `, [datasetId, accountId]);

    // 3. Registrar el evento en el historial
    await client.query(`
      INSERT INTO dataset_events (dataset_id, actor_account_id, event_type, event_result, event_comment)
      VALUES ($1, $2, 'destroy_requested', 'success', 'El usuario ha solicitado la destrucción física del recurso.')
    `, [datasetId, accountId]);

    await client.query('COMMIT');
    return { message: "Tu solicitud de eliminación ha sido enviada para revisión administrativa." };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}