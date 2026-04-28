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
import {createFullDatasetInDb, 
  recordDatasetEvent, 
  fetchDatasetsPaginated,
  fetchDatasetDetailsFromDb, 
  archiveDatasetInDb,
  updateDatasetInDb,
createDatasetRequestInDb,
resolveDatasetRequestInDb,
hardDeleteDatasetInDb,
unarchiveDatasetInDb} from "../repositories/datasets.repository";
import { z } from "zod";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../config/s3";
import { AppError } from "../types/app-error";
import { env } from "../config/env";
import { S3Client, DeleteObjectCommand} from "@aws-sdk/client-s3";


/**
 * POR QUÉ: Los campos `file_format` y `mime_type` se dejan deliberadamente permisivos (strings genéricos) para evitar que la capa de servicio rechace archivos con firmas MIME inconsistentes originadas por el sistema operativo del cliente (ej. Windows). El "fallback" y normalización real se maneja en el repositorio.
 */
const fileSchema = z.object({
  storage_key: z.string().min(1, "El storage_key es obligatorio"),
  file_url: z.string().url("Debe ser una URL válida"),
  
  file_role: z.enum(['source', 'preview', 'documentation', 'attachment']).default('source'),
  display_name: z.string().min(1, "El nombre del archivo es obligatorio"),
  file_format: z.string().min(1), 
  mime_type: z.string().min(1),
  file_size_bytes: z.number().int().positive(),
  is_primary: z.boolean().default(false)
});


const createDatasetSchema = z.object({
  title: z.string().min(1, "El título es obligatorio."),
  category_id: z.number().int().positive(),
  institution_id: z.number().int().positive().optional().nullable(),
  license_id: z.number().int().positive(),
  ods_objective_id: z.number().int().positive().optional().nullable(),
  summary: z.string().max(500, "Máximo 500 caracteres."),
  description: z.string().min(1),
  access_level: z.enum(['public', 'internal']).default('public'),

  creation_date: z.string().min(1, "La fecha de creación es obligatoria."),
  geographic_coverage: z.string().max(255).optional().nullable(),
  update_frequency: z.string().max(100).optional().nullable(),
  source_url: z.string().url("URL de fuente inválida").optional().nullable(),
  temporal_coverage_start: z.string().optional().nullable(),
  temporal_coverage_end: z.string().optional().nullable(),

  files: z.array(fileSchema).min(1, "Debe subir al menos un archivo."),
  tags: z.array(z.number().int()).min(1, "Debes seleccionar al menos 1 etiqueta").max(5, "Máximo 5 etiquetas")
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
export async function createDataset(accountId: number, isAdmin: boolean, input: any) {
  const validatedData = createDatasetSchema.parse(input);
  const result = await createFullDatasetInDb(accountId, isAdmin, validatedData);

  await recordDatasetEvent({
    dataset_id: result.dataset_id, 
    actor_account_id: accountId,
    event_type: 'created',
    event_result: 'success',
    event_comment: 'Dataset creado manualmente por administrador'
  });

  return result;
}


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
export async function getDatasets(accountId: number, isAdmin: boolean, search: string = "", page: number = 1, limit: number = 10, filters: any = {}) { 
  const offset = (page - 1) * limit;
  // Pasamos los filtros al repositorio
  const result = await fetchDatasetsPaginated(accountId, isAdmin, search, limit, offset, filters); 
  
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
export async function getDatasetById(id: number) {
  const dataset = await fetchDatasetDetailsFromDb(id);
  if (!dataset) throw new AppError("Dataset no encontrado", 404);

  if (dataset.files && dataset.files.length > 0) {
    dataset.files = await Promise.all(
      dataset.files.map(async (file: any) => {
        if (file.storage_key) {
          try {
            const command = new GetObjectCommand({ Bucket: env.S3_BUCKET_NAME, Key: file.storage_key });
            const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            const finalUrl = presignedUrl.replace('storage:9000', 'localhost:9000');
            
            return { ...file, file_url: finalUrl };
          } catch (error) {
            console.error(`Error firmando URL del archivo ${file.storage_key}:`, error);
            return file;
          }
        }
        return file;
      })
    );
  }

  return dataset;
}

/**
 * Descripción: Archiva un dataset para ocultarlo de las vistas públicas.
 */
export async function archiveDataset(datasetId: number, accountId: number) {
  try {
    const result = await archiveDatasetInDb(datasetId, accountId);
    const title = result.dataset?.title || datasetId;
    return { message: `El dataset '${title}' fue archivado correctamente.` };
  } catch (error: any) {
    if (error.message.includes("no encontrado")) throw new AppError(error.message, 404);
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
export async function editDataset(datasetId: number, accountId: number, input: any) {
  try {
    const result = await updateDatasetInDb(datasetId, accountId, input);
    if (result.s3KeysToDelete && result.s3KeysToDelete.length > 0) {
      // Usamos la variable de entorno directamente
      const bucketName = env.S3_BUCKET_NAME; 
      console.log(`\n🗑️ [S3/MinIO] Intentando borrar ${result.s3KeysToDelete.length} archivos del bucket: "${bucketName}"...`);

      for (const key of result.s3KeysToDelete) {
         try {
           // Usamos el s3Client global, sin hardcodear nada
           const deleteCommand = new DeleteObjectCommand({ 
             Bucket: bucketName, 
             Key: key 
           });
           
           await s3Client.send(deleteCommand);
           console.log(`   ✅ ÉXITO: Archivo destruido físicamente -> ${key}`);
         } catch(e: any) { 
           console.error(`   ❌ FALLO AL BORRAR -> ${key}`);
           console.error(`      Motivo: ${e.message || e.Code}`);
         }
      }
      console.log(`--------------------------------------------------\n`);
    } else {
      console.log("ℹ️ No se detectaron archivos eliminados en esta edición.");
    }
    
    // Retornamos solo el dataset actualizado hacia el controlador
    return result.updatedDataset;

  } catch (error: any) {
    if (error.message.includes("no encontrado")) throw new AppError(error.message, 404);
    throw error;
  }
}

// 1. Añadimos el estado y hacemos el mensaje opcional en Zod
const requestDatasetSchema = createDatasetSchema.extend({
  dataset_status: z.enum(['draft', 'pending_validation']),
  message: z.string().optional().nullable()
});

/**
 * Servicio para procesar la solicitud o el borrador de un dataset por parte de un usuario.
 */
export async function submitDatasetRequest(accountId: number, input: any) {
  const validatedData = requestDatasetSchema.parse(input);
  
  const result = await createDatasetRequestInDb(accountId, validatedData);
  return result;
}

// Añade esto cerca de tus otros esquemas (arriba)
const resolveRequestSchema = z.object({
  action: z.enum(['publish', 'reject']),
  review_comment: z.string().min(5, "Debes incluir un comentario de revisión justificando la decisión.")
});

// Añade esta función al final del archivo
export async function resolveDatasetRequest(datasetId: number, adminAccountId: number, input: any) {
  try {
    const validatedData = resolveRequestSchema.parse(input);
    const result = await resolveDatasetRequestInDb(datasetId, adminAccountId, validatedData.action, validatedData.review_comment);
    return result;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Descripción: Orquesta la destrucción física total en Base de Datos y MinIO.
 */
export async function destroyDataset(datasetId: number) {
  try {
    console.log(`\n--- INICIANDO DESTRUCCIÓN TOTAL DE DATASET ID: ${datasetId} ---`);
    
    const result = await hardDeleteDatasetInDb(datasetId);
    
    if (result.filesToDelete && result.filesToDelete.length > 0) {
      const bucketName = env.S3_BUCKET_NAME;

      for (const file of result.filesToDelete) {
        if (file.storage_key) {
          try {
            // Usamos s3Client global
            await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: file.storage_key }));
            console.log(`✅ Físicamente destruido: ${file.storage_key}`);
          } catch (e: any) {
            console.error(`❌ Error borrando: ${file.storage_key} - ${e.message}`);
          }
        }
      }
    }
    
    console.log(`--- FIN DEL PROCESO DE DESTRUCCIÓN ---\n`);
    return { message: `El dataset '${result.title}' fue destruido permanentemente de la base de datos y del servidor de archivos.` };
    
  } catch (error: any) {
    if (error.message.includes("no encontrado")) throw new AppError(error.message, 404);
    throw error;
  }
}

/**
 * Descripción: Cambia el estado de un dataset de 'archived' a 'published'.
 */
export async function unarchiveDataset(datasetId: number, accountId: number) {
  try {
    const result = await unarchiveDatasetInDb(datasetId, accountId);
    return { message: `El dataset '${result.dataset.title}' ahora es visible nuevamente.` };
  } catch (error: any) {
    if (error.message.includes("no encontrado")) throw new AppError(error.message, 404);
    throw error;
  }
}