"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDataset = createDataset;
exports.getDatasets = getDatasets;
exports.getDatasetById = getDatasetById;
exports.removeDataset = removeDataset;
exports.editDataset = editDataset;
exports.submitDatasetRequest = submitDatasetRequest;
exports.resolveDatasetRequest = resolveDatasetRequest;
/**
 * ============================================================================
 * MÓDULO: Servicio de Conjuntos de Datos (datasets.service.ts)
 * * PROPÓSITO: Orquestar la lógica de negocio para el ciclo de vida de los
 * datasets (creación, lectura, edición, borrado físico y lógico).
 * * RESPONSABILIDAD: Validar las estructuras de datos entrantes (Zod), gestionar
 * la comunicación con AWS S3/MinIO para la generación de URLs prefirmadas y
 * eliminación de objetos, y coordinar las transacciones de base de datos a
 * través de la capa de repositorios.
 * * ROL EN EL FLUJO DEL PROGRAMA: Actúa como el puente inteligente entre los
 * enrutadores (datasets.routes.ts) y los repositorios o servicios externos en la nube.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Validación Centralizada: Los esquemas de Zod se ubican en esta capa (y no en
 * las rutas) para garantizar que las reglas de negocio de los metadatos se apliquen
 * consistentemente sin importar el punto de entrada (API, CLI, etc.).
 * - Separación de Borrados: Mientras la base de datos utiliza Soft Delete (estado 'deleted')
 * por cuestiones de auditoría, los archivos en S3 se eliminan físicamente para ahorrar costos.
 * ============================================================================
 */
const datasets_repository_1 = require("../repositories/datasets.repository");
const zod_1 = require("zod");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3_1 = require("../config/s3");
const app_error_1 = require("../types/app-error");
const env_1 = require("../config/env");
const client_s3_2 = require("@aws-sdk/client-s3");
/**
 * POR QUÉ: Los campos `file_format` y `mime_type` se dejan deliberadamente permisivos (strings genéricos) para evitar que la capa de servicio rechace archivos con firmas MIME inconsistentes originadas por el sistema operativo del cliente (ej. Windows). El "fallback" y normalización real se maneja en el repositorio.
 */
const fileSchema = zod_1.z.object({
    storage_key: zod_1.z.string().min(1, "El storage_key es obligatorio"),
    file_url: zod_1.z.string().url("Debe ser una URL válida"),
    file_role: zod_1.z.enum(['source', 'preview', 'documentation', 'attachment']).default('source'),
    display_name: zod_1.z.string().min(1, "El nombre del archivo es obligatorio"),
    file_format: zod_1.z.string().min(1),
    mime_type: zod_1.z.string().min(1),
    file_size_bytes: zod_1.z.number().int().positive(),
    is_primary: zod_1.z.boolean().default(false)
});
const createDatasetSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "El título es obligatorio."),
    category_id: zod_1.z.number().int().positive(),
    institution_id: zod_1.z.number().int().positive().optional().nullable(),
    license_id: zod_1.z.number().int().positive(),
    ods_objective_id: zod_1.z.number().int().positive().optional().nullable(),
    summary: zod_1.z.string().max(500, "Máximo 500 caracteres."),
    description: zod_1.z.string().min(1),
    access_level: zod_1.z.enum(['public', 'internal']).default('public'),
    creation_date: zod_1.z.string().min(1, "La fecha de creación es obligatoria."),
    geographic_coverage: zod_1.z.string().max(255).optional().nullable(),
    update_frequency: zod_1.z.string().max(100).optional().nullable(),
    source_url: zod_1.z.string().url("URL de fuente inválida").optional().nullable(),
    temporal_coverage_start: zod_1.z.string().optional().nullable(),
    temporal_coverage_end: zod_1.z.string().optional().nullable(),
    files: zod_1.z.array(fileSchema).min(1, "Debe subir al menos un archivo.")
});
/**
 * Descripción: Coordina la validación, persistencia y el registro de auditoría en la creación de un nuevo dataset.
 * POR QUÉ: Se extrae el `dataset_id` devuelto por el repositorio tras la transacción para disparar manualmente el evento de auditoría `created`. Esto garantiza que la traza forense exista desde el milisegundo cero de vida del recurso.
 * @param {number} accountId ID del usuario que ejecuta la acción.
 * @param {boolean} isAdmin Flag indicando si el actor tiene permisos de administrador.
 * @param {any} input Payload crudo enviado por el cliente.
 * @return {Promise<Object>} Resultado con el ID generado y el título.
 * @throws {ZodError} Si el payload no cumple con los esquemas de metadatos o archivos.
 */
async function createDataset(accountId, isAdmin, input) {
    const validatedData = createDatasetSchema.parse(input);
    const result = await (0, datasets_repository_1.createFullDatasetInDb)(accountId, isAdmin, validatedData);
    await (0, datasets_repository_1.recordDatasetEvent)({
        dataset_id: result.dataset_id,
        actor_account_id: accountId,
        event_type: 'created',
        event_result: 'success',
        event_comment: 'Dataset creado manualmente por administrador'
    });
    return result;
}
// 👈 Añade el 6to parámetro
/**
 * Descripción: Construye la información de paginación y recupera el listado de datasets.
 * POR QUÉ: Calcula el `offset` y el total de páginas (`totalPages`) matemáticamente en esta capa para mantener al repositorio agnóstico de las lógicas de interfaz, devolviendo un objeto estructurado directamente consumible por los componentes de tablas del frontend.
 * @param {number} accountId ID del usuario (reservado para control de visibilidad).
 * @param {boolean} isAdmin Permisos administrativos para anular filtros.
 * @param {string} search Término de búsqueda parcial.
 * @param {number} page Página solicitada (1-indexed).
 * @param {number} limit Cantidad máxima de registros por página.
 * @return {Promise<Object>} Objeto con total, páginas y la colección de datos.
 * @throws {Error} Excepciones no controladas de la base de datos.
 */
async function getDatasets(accountId, isAdmin, search = "", page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    // Pasamos los filtros al repositorio
    const result = await (0, datasets_repository_1.fetchDatasetsPaginated)(accountId, isAdmin, search, limit, offset, filters);
    return {
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        data: result.data
    };
}
/**
 * Descripción: Obtiene el detalle completo del dataset e hidrata los archivos con URLs temporales de acceso seguro.
 * POR QUÉ: Implementa una reescritura de URL (`.replace('storage:9000', 'localhost:9000')`) como un "workaround" para entornos Docker locales. El backend se comunica con MinIO a través de la red interna de Docker (`storage`), pero el cliente web necesita acceder mediante `localhost`. Las URLs generadas tienen un TTL de 3600 segundos (1 hora) por políticas de seguridad.
 * @param {number} id Identificador numérico del dataset.
 * @return {Promise<Object>} Dataset completo con las URLs de sus archivos firmadas criptográficamente.
 * @throws {AppError} 404 si el ID no corresponde a un dataset existente.
 */
async function getDatasetById(id) {
    const dataset = await (0, datasets_repository_1.fetchDatasetDetailsFromDb)(id);
    if (!dataset)
        throw new app_error_1.AppError("Dataset no encontrado", 404);
    if (dataset.files && dataset.files.length > 0) {
        dataset.files = await Promise.all(dataset.files.map(async (file) => {
            if (file.storage_key) {
                try {
                    const command = new client_s3_1.GetObjectCommand({ Bucket: env_1.env.S3_BUCKET_NAME, Key: file.storage_key });
                    const presignedUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3_1.s3Client, command, { expiresIn: 3600 });
                    const finalUrl = presignedUrl.replace('storage:9000', 'localhost:9000');
                    return { ...file, file_url: finalUrl };
                }
                catch (error) {
                    console.error(`Error firmando URL del archivo ${file.storage_key}:`, error);
                    return file;
                }
            }
            return file;
        }));
    }
    return dataset;
}
/**
 * Descripción: Ejecuta el borrado lógico del dataset y la destrucción física de sus archivos en la nube.
 * POR QUÉ: Si la llamada al SDK de AWS (`DeleteObjectCommand`) falla por desincronización o indisponibilidad temporal, el error es capturado (`catch (s3Error)`) pero NO se aborta la ejecución principal. Esto previene que el dataset quede "inborrable" en la base de datos debido a un archivo fantasma en el bucket.
 * @param {number} datasetId ID del dataset a eliminar.
 * @param {number} accountId ID del administrador que realiza la acción.
 * @return {Promise<Object>} Mensaje de éxito de la operación.
 * @throws {AppError} 404 si el dataset no existe o ya fue borrado previamente.
 */
async function removeDataset(datasetId, accountId) {
    try {
        console.log(`\n--- INICIANDO BORRADO DE DATASET ID: ${datasetId} ---`);
        // 1. Borrado lógico en base de datos
        const result = await (0, datasets_repository_1.softDeleteDatasetInDb)(datasetId, accountId);
        console.log(`✅ BD Actualizada. Archivos encontrados para borrar físicamente:`, result.filesToDelete?.length || 0);
        if (result.filesToDelete && result.filesToDelete.length > 0) {
            // 👇 2. EL SECRETO: Cliente interno para Docker apuntando a 'minio' 👇
            const internalS3Client = new client_s3_2.S3Client({
                region: env_1.env.S3_REGION || 'us-east-1',
                endpoint: 'http://minio:9000', // Cambia 'minio' si tu contenedor se llama distinto
                credentials: {
                    accessKeyId: env_1.env.S3_ACCESS_KEY || 'admin_minio',
                    secretAccessKey: env_1.env.S3_SECRET_KEY || 'password123',
                },
                forcePathStyle: true,
            });
            const bucketName = env_1.env.S3_BUCKET_NAME || 'observatory-files';
            // 3. Iterar y borrar cada archivo de MinIO
            for (const file of result.filesToDelete) {
                if (file.storage_key) {
                    console.log(`⏳ Intentando eliminar de MinIO el archivo con Key: "${file.storage_key}" en el Bucket: "${bucketName}"`);
                    try {
                        const deleteCommand = new client_s3_2.DeleteObjectCommand({
                            Bucket: bucketName,
                            Key: file.storage_key
                        });
                        // Usamos internalS3Client en vez de s3Client
                        await internalS3Client.send(deleteCommand);
                        console.log(`✅ ÉXITO: Archivo físico destruido en MinIO -> ${file.storage_key}`);
                    }
                    catch (s3Error) {
                        console.error(`❌ FALLO CRÍTICO AL BORRAR EN MINIO:`);
                        console.error(`   - Key: ${file.storage_key}`);
                        console.error(`   - Código de error: ${s3Error.Code || s3Error.name}`);
                        console.error(`   - Mensaje: ${s3Error.message}`);
                    }
                }
                else {
                    console.warn(`⚠️ El archivo ID ${file.aws_file_reference_id} no tiene storage_key válido.`);
                }
            }
        }
        else {
            console.log(`ℹ️ No se encontraron archivos vinculados a este dataset para borrar en MinIO.`);
        }
        console.log(`--- FIN DEL PROCESO ---\n`);
        // Aseguramos que lea el título correctamente dependiendo de la estructura de tu repositorio
        const title = result.dataset?.title || datasetId;
        return { message: `El dataset '${title}' fue eliminado correctamente.` };
    }
    catch (error) {
        if (error.message.includes("no encontrado"))
            throw new app_error_1.AppError(error.message, 404);
        throw error;
    }
}
/**
 * Descripción: Transfiere el payload de actualización de metadatos hacia la capa de datos.
 * POR QUÉ: Actúa como pasarela asumiendo que el controlador HTTP o una fase previa validó los tipos base. Atrapa errores genéricos de tipo "no encontrado" provenientes del motor SQL para transformarlos en un `AppError` estandarizado, evitando filtraciones técnicas al cliente web.
 * @param {number} datasetId ID del dataset a actualizar.
 * @param {number} accountId ID del actor que ejecuta el cambio.
 * @param {any} input Objeto con los nuevos valores para los campos del dataset.
 * @return {Promise<Object>} Instancia del dataset actualizado.
 * @throws {AppError} 404 si el registro no es ubicado.
 */
async function editDataset(datasetId, accountId, input) {
    try {
        const result = await (0, datasets_repository_1.updateDatasetInDb)(datasetId, accountId, input);
        if (result.s3KeysToDelete && result.s3KeysToDelete.length > 0) {
            const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
            // Cliente exclusivo para la red interna de Docker
            const internalS3Client = new S3Client({
                region: env_1.env.S3_REGION || 'us-east-1',
                // 👇 CAMBIA "minio" por el nombre de tu contenedor si es distinto (ej: minio-dev)
                endpoint: 'http://minio:9000',
                credentials: {
                    accessKeyId: env_1.env.S3_ACCESS_KEY || 'admin_minio', // 👈 Tus credenciales
                    secretAccessKey: env_1.env.S3_SECRET_KEY || 'password123', // 👈 Tus credenciales
                },
                forcePathStyle: true,
            });
            const bucketName = env_1.env.S3_BUCKET_NAME || 'observatory-files';
            console.log(`\n🗑️ [MINIO] Intentando borrar ${result.s3KeysToDelete.length} archivos del bucket: "${bucketName}"...`);
            for (const key of result.s3KeysToDelete) {
                try {
                    const deleteCommand = new DeleteObjectCommand({
                        Bucket: bucketName,
                        Key: key
                    });
                    await internalS3Client.send(deleteCommand);
                    console.log(`   ✅ ÉXITO: Archivo destruido físicamente de MinIO -> ${key}`);
                }
                catch (e) {
                    console.error(`   ❌ FALLO AL BORRAR -> ${key}`);
                    console.error(`      Motivo: ${e.message || e.Code}`);
                }
            }
            console.log(`--------------------------------------------------\n`);
        }
        else {
            console.log("ℹ️ No se detectaron archivos eliminados en esta edición.");
        }
        // Retornamos solo el dataset actualizado hacia el controlador
        return result.updatedDataset;
    }
    catch (error) {
        if (error.message.includes("no encontrado"))
            throw new app_error_1.AppError(error.message, 404);
        throw error;
    }
}
// 1. Añadimos el estado y hacemos el mensaje opcional en Zod
const requestDatasetSchema = createDatasetSchema.extend({
    dataset_status: zod_1.z.enum(['draft', 'pending_validation']),
    message: zod_1.z.string().optional().nullable()
});
/**
 * Servicio para procesar la solicitud o el borrador de un dataset por parte de un usuario.
 */
async function submitDatasetRequest(accountId, input) {
    const validatedData = requestDatasetSchema.parse(input);
    // 2. Validación de negocio: El mensaje es obligatorio SOLO si va a revisión
    if (validatedData.dataset_status === 'pending_validation') {
        if (!validatedData.message || validatedData.message.trim().length < 10) {
            throw new app_error_1.AppError("Por favor, incluye un mensaje descriptivo para el revisor (mínimo 10 caracteres).", 400);
        }
    }
    const result = await (0, datasets_repository_1.createDatasetRequestInDb)(accountId, validatedData);
    return result;
}
// Añade esto cerca de tus otros esquemas (arriba)
const resolveRequestSchema = zod_1.z.object({
    action: zod_1.z.enum(['publish', 'reject']),
    review_comment: zod_1.z.string().min(5, "Debes incluir un comentario de revisión justificando la decisión.")
});
// Añade esta función al final del archivo
async function resolveDatasetRequest(datasetId, adminAccountId, input) {
    try {
        const validatedData = resolveRequestSchema.parse(input);
        const result = await (0, datasets_repository_1.resolveDatasetRequestInDb)(datasetId, adminAccountId, validatedData.action, validatedData.review_comment);
        return result;
    }
    catch (error) {
        throw error;
    }
}
