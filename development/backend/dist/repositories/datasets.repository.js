"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFullDatasetInDb = createFullDatasetInDb;
exports.recordDatasetEvent = recordDatasetEvent;
exports.fetchDatasetsPaginated = fetchDatasetsPaginated;
exports.fetchDatasetDetailsFromDb = fetchDatasetDetailsFromDb;
exports.softDeleteDatasetInDb = softDeleteDatasetInDb;
exports.updateDatasetInDb = updateDatasetInDb;
exports.createDatasetRequestInDb = createDatasetRequestInDb;
exports.resolveDatasetRequestInDb = resolveDatasetRequestInDb;
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
const db_1 = require("../config/db");
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
async function createFullDatasetInDb(accountId, isAdmin, data) {
    const client = await db_1.pool.connect();
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
            if (safeMimeType === 'application/x-zip-compressed')
                safeMimeType = 'application/zip';
            if (safeMimeType === 'application/vnd.ms-excel')
                safeMimeType = 'text/csv'; // Por si Windows lee los CSV como Excel
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
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
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
async function recordDatasetEvent(eventData) {
    const query = `
    INSERT INTO dataset_events (
      dataset_id, actor_account_id, event_type, event_result, event_comment
    ) VALUES ($1, $2, $3, $4, $5)
  `;
    await db_1.pool.query(query, [
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
async function fetchDatasetsPaginated(accountId, isAdmin, search, limit, offset, filters = {}) {
    let baseQuery = `
    FROM datasets d
    LEFT JOIN categories c ON d.category_id = c.category_id
    LEFT JOIN institutions i ON d.institution_id = i.institution_id
    LEFT JOIN licenses l ON d.license_id = l.license_id
    WHERE 1=1
  `;
    const queryParams = [];
    // 2. Filtro de búsqueda por texto
    if (search) {
        queryParams.push(`%${search}%`);
        baseQuery += ` AND (d.title ILIKE $${queryParams.length} OR d.description ILIKE $${queryParams.length})`;
    }
    // 3. 🔹 FILTRADO POR IDs (Mucho más robusto que por nombres)
    // Categoría: Filtramos directamente por d.category_id
    if (filters.categoria) {
        queryParams.push(filters.categoria);
        baseQuery += ` AND d.category_id = ANY(string_to_array($${queryParams.length}, ',')::integer[])`;
    }
    // Licencia: Filtramos directamente por d.license_id
    if (filters.licencia) {
        queryParams.push(filters.licencia);
        baseQuery += ` AND d.license_id = ANY(string_to_array($${queryParams.length}, ',')::integer[])`;
    }
    // Etiquetas: Filtramos por dt.tag_id en la tabla relacional
    if (filters.etiqueta) {
        queryParams.push(filters.etiqueta);
        baseQuery += ` AND EXISTS (
      SELECT 1 FROM dataset_tags dt
      WHERE dt.dataset_id = d.dataset_id
      AND dt.tag_id = ANY(string_to_array($${queryParams.length}, ',')::integer[])
    )`;
    }
    // 4. Conteo y Paginación
    const countQuery = `SELECT COUNT(DISTINCT d.dataset_id) ${baseQuery}`;
    const countRes = await db_1.pool.query(countQuery, queryParams);
    const total = parseInt(countRes.rows[0].count, 10);
    queryParams.push(limit, offset);
    const dataQuery = `
    SELECT 
      d.dataset_id, 
      d.title as nombre, 
      c.name as categoria, 
      i.legal_name as institucion, 
      TO_CHAR(d.created_at, 'YYYY-MM-DD') as fecha, 
      d.dataset_status
    ${baseQuery}
    ORDER BY d.created_at DESC
    LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
  `;
    const { rows } = await db_1.pool.query(dataQuery, queryParams);
    return { total, data: rows };
}
/**
 * Descripción: Extrae el grafo completo de información de un dataset, combinando metadatos, archivos físicos y trazabilidad.
 * POR QUÉ: Para evitar un Producto Cartesiano ineficiente (que multiplicaría filas al hacer JOIN con múltiples tablas de relación uno a muchos), se divide estratégicamente en tres consultas secuenciales independientes. El objeto resultante se ensambla en la memoria de Node.js, lo que resulta mucho más ligero y veloz para la base de datos.
 * @param {number} id Identificador único del dataset.
 * @return {Promise<Object | null>} Objeto con el modelo del dataset inyectando arreglos en `files` y `events`, o null si no existe.
 * @throws {Error} Excepciones generadas por fallos en el motor de base de datos.
 */
async function fetchDatasetDetailsFromDb(id) {
    // A. Metadatos principales
    const dsRes = await db_1.pool.query(`
    SELECT d.*, c.name as category_name, i.legal_name as institution_name, l.name as license_name
    FROM datasets d LEFT JOIN categories c ON d.category_id = c.category_id
    LEFT JOIN institutions i ON d.institution_id = i.institution_id
    LEFT JOIN licenses l ON d.license_id = l.license_id
    WHERE d.dataset_id = $1
  `, [id]);
    if (dsRes.rowCount === 0)
        return null;
    const dataset = dsRes.rows[0];
    // B. Archivos subidos
    const filesRes = await db_1.pool.query(`
    SELECT afr.aws_file_reference_id, df.display_name, afr.file_url, afr.storage_key, afr.mime_type, afr.file_size_bytes
    FROM aws_file_references afr
    INNER JOIN dataset_files df ON afr.aws_file_reference_id = df.aws_file_reference_id
    WHERE df.dataset_id = $1
  `, [id]);
    dataset.files = filesRes.rows;
    // C. Eventos de auditoría
    const eventsRes = await db_1.pool.query(`
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
 * Descripción: Desactiva lógicamente un dataset de las visualizaciones públicas.
 * POR QUÉ: Altera el campo `dataset_status` en lugar de emitir un comando `DELETE`. Esta decisión arquitectónica se toma para mantener intactos los eventos históricos de la tabla `dataset_events` y las asociaciones referenciales con los bucket stores (AWS S3) sin dejar registros huérfanos. Se ejecuta dentro de una transacción para forzar el registro del evento de auditoría de borrado.
 * @param {number} datasetId ID del dataset objetivo.
 * @param {number} accountId ID del administrador/actor que ejecuta la acción.
 * @return {Promise<Object>} Registro del dataset afectado con su ID y título actualizado.
 * @throws {Error} Si el dataset ya estaba eliminado, no existe, o fallan las constraints.
 */
/**
 * Descripción: Desactiva lógicamente un dataset y recupera las llaves de sus archivos
 * para que el servicio pueda destruirlos físicamente en MinIO.
 */
async function softDeleteDatasetInDb(datasetId, accountId) {
    const client = await db_1.pool.connect();
    try {
        await client.query('BEGIN');
        // 👇 1. NUEVO: Buscamos los archivos asociados ANTES de hacer nada 👇
        const filesQuery = `
      SELECT afr.aws_file_reference_id, afr.storage_key
      FROM dataset_files df
      INNER JOIN aws_file_references afr ON df.aws_file_reference_id = afr.aws_file_reference_id
      WHERE df.dataset_id = $1
    `;
        const filesRes = await client.query(filesQuery, [datasetId]);
        const filesToDelete = filesRes.rows;
        // 2. Actualizamos el estado del dataset (Soft Delete)
        const updateQuery = `
      UPDATE datasets 
      SET dataset_status = 'deleted', deleted_at = NOW(), updated_at = NOW()
      WHERE dataset_id = $1 AND dataset_status != 'deleted'
      RETURNING dataset_id, title
    `;
        const res = await client.query(updateQuery, [datasetId]);
        if (res.rowCount === 0)
            throw new Error("Dataset no encontrado o ya eliminado");
        // 3. Registramos el evento de auditoría
        await client.query(`
      INSERT INTO dataset_events (dataset_id, actor_account_id, event_type, event_result, event_comment)
      VALUES ($1, $2, 'deleted', 'success', 'Dataset eliminado lógicamente por administrador')
    `, [datasetId, accountId]);
        // 4. NUEVO: Marcamos los archivos físicos como 'deleted' en la BD por coherencia
        if (filesToDelete.length > 0) {
            const fileIds = filesToDelete.map(f => f.aws_file_reference_id);
            await client.query(`
            UPDATE aws_file_references 
            SET status = 'deleted' 
            WHERE aws_file_reference_id = ANY($1::bigint[])
        `, [fileIds]);
        }
        await client.query('COMMIT');
        // 👇 5. NUEVO: Retornamos el dataset y la lista de archivos al servicio 👇
        return {
            dataset: res.rows[0],
            filesToDelete: filesToDelete
        };
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
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
async function updateDatasetInDb(datasetId, accountId, data) {
    const client = await db_1.pool.connect();
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
        if (res.rowCount === 0)
            throw new Error("Dataset no encontrado");
        // 2. INSERTAR NUEVOS ARCHIVOS (Misma lógica que al crear)
        if (data.new_files && data.new_files.length > 0) {
            for (const file of data.new_files) {
                let safeMimeType = file.mime_type;
                if (safeMimeType === 'application/x-zip-compressed')
                    safeMimeType = 'application/zip';
                if (safeMimeType === 'application/vnd.ms-excel')
                    safeMimeType = 'text/csv';
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
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
/**
 * Crea un dataset generado por un usuario.
 * Si es 'pending_validation', genera la solicitud formal. Si es 'draft', solo lo guarda.
 */
async function createDatasetRequestInDb(accountId, data) {
    const client = await db_1.pool.connect();
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
        // 2. Insertar Archivos (sin cambios)
        for (const file of data.files) {
            let safeMimeType = file.mime_type;
            if (safeMimeType === 'application/x-zip-compressed')
                safeMimeType = 'application/zip';
            if (safeMimeType === 'application/vnd.ms-excel')
                safeMimeType = 'text/csv';
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
        }
        else {
            // Es un borrador silencioso (draft)
            await client.query(`
        INSERT INTO dataset_events (dataset_id, actor_account_id, event_type, event_result, event_comment)
        VALUES ($1, $2, 'created', 'success', 'Dataset guardado como borrador personal.')
      `, [dataset_id, accountId]);
        }
        await client.query('COMMIT');
        return { dataset_id, title: data.title, status: data.dataset_status };
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
/**
 * Resuelve una solicitud de dataset (Publicar o Rechazar).
 * Actualiza datasets, dataset_requests y genera un dataset_events.
 */
async function resolveDatasetRequestInDb(datasetId, adminAccountId, action, reviewComment) {
    const client = await db_1.pool.connect();
    try {
        await client.query('BEGIN');
        const newDatasetStatus = action === 'publish' ? 'published' : 'rejected';
        const newRequestStatus = action === 'publish' ? 'approved' : 'rejected';
        const eventType = action === 'publish' ? 'published' : 'rejected';
        // 1. Actualizar el Dataset
        const updateDatasetQuery = `
      UPDATE datasets 
      SET dataset_status = $1, updated_at = NOW()
      ${action === 'publish' ? ', published_at = NOW()' : ''}
      WHERE dataset_id = $2
      RETURNING title
    `;
        const dsRes = await client.query(updateDatasetQuery, [newDatasetStatus, datasetId]);
        if (dsRes.rowCount === 0)
            throw new Error("Dataset no encontrado");
        // 2. Actualizar la Solicitud (dataset_requests)
        await client.query(`
      UPDATE dataset_requests 
      SET request_status = $1, review_comment = $2, claimed_by_admin_account_id = $3, updated_at = NOW(), claimed_at = NOW()
      WHERE dataset_id = $4 AND request_status = 'pending'
    `, [newRequestStatus, reviewComment, adminAccountId, datasetId]);
        // 3. Registrar el Evento de Auditoría
        const eventComment = `El administrador ha ${action === 'publish' ? 'publicado' : 'rechazado'} el dataset. Comentario: ${reviewComment}`;
        await client.query(`
      INSERT INTO dataset_events (dataset_id, actor_account_id, event_type, event_result, event_comment)
      VALUES ($1, $2, $3, 'success', $4)
    `, [datasetId, adminAccountId, eventType, eventComment]);
        await client.query('COMMIT');
        return { message: `Dataset ${newDatasetStatus} exitosamente.` };
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
