<<<<<<< HEAD
// En src/services/datasets.service.ts
import {createFullDatasetInDb, 
  recordDatasetEvent, 
  fetchDatasetsPaginated,
  fetchDatasetDetailsFromDb, 
  softDeleteDatasetInDb,
  updateDatasetInDb } from "../repositories/datasets.repository";
import { z } from "zod";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../config/s3";
import { AppError } from "../types/app-error";
import { env } from "../config/env";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

// 1. 👇 CORRECCIÓN: Adaptamos el esquema a lo que manda React (MinIO) 👇
const fileSchema = z.object({
  storage_key: z.string().min(1, "El storage_key es obligatorio"),
  file_url: z.string().url("Debe ser una URL válida"),
  
  file_role: z.enum(['source', 'preview', 'documentation', 'attachment']).default('source'),
  display_name: z.string().min(1, "El nombre del archivo es obligatorio"),
  
  // Lo dejamos como string genérico para que no rechace formatos nuevos temporalmente
  file_format: z.string().min(1), 
  mime_type: z.string().min(1),
  file_size_bytes: z.number().int().positive(),
  is_primary: z.boolean().default(false)
});

// 2. Definimos el esquema principal del Dataset (Se mantiene igual)
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

  files: z.array(fileSchema).min(1, "Debe subir al menos un archivo.")
});

export async function createDataset(accountId: number, isAdmin: boolean, input: any) {
  const validatedData = createDatasetSchema.parse(input);
  
  // 1. Persistencia principal
  const result = await createFullDatasetInDb(accountId, isAdmin, validatedData);

  // 2. Registro de evento 'created'
  // 👈 Error 2 corregido: Sincronización con el nombre de la propiedad devuelta por el repo (dataset_id)
  await recordDatasetEvent({
    dataset_id: result.dataset_id, 
    actor_account_id: accountId,
    event_type: 'created',
    event_result: 'success',
    event_comment: 'Dataset creado manualmente por administrador'
  });

  return result;
}

export async function getDatasets(accountId: number, isAdmin: boolean, search: string = "", page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;
=======
import { createFullDatasetInDb, fetchDatasetsPaginated } from "../repositories/datasets.repository";
import { AppError } from "../types/app-error"; 

export async function getDatasets(accountId: number, isAdmin: boolean, search: string = "", page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;
  
  // Llamamos a la función con el nombre correcto del repositorio
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  const result = await fetchDatasetsPaginated(accountId, isAdmin, search, limit, offset);
  
  return {
    total: result.total,
    totalPages: Math.ceil(result.total / limit),
    data: result.data
  };
}

<<<<<<< HEAD
// 1. Servicio para "Revisar"
export async function getDatasetById(id: number) {
  const dataset = await fetchDatasetDetailsFromDb(id);
  if (!dataset) throw new AppError("Dataset no encontrado", 404);

  // 👇 SOLUCIÓN PROBLEMA 2: FIRMAR URLs DE ARCHIVOS 👇
  if (dataset.files && dataset.files.length > 0) {
    dataset.files = await Promise.all(
      dataset.files.map(async (file: any) => {
        if (file.storage_key) {
          try {
            const command = new GetObjectCommand({ Bucket: env.S3_BUCKET_NAME, Key: file.storage_key });
            const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            
            // Reemplazo para que funcione en Docker/Localhost
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

// 2. Servicio para "Eliminar"
export async function removeDataset(datasetId: number, accountId: number) {
  try {
    console.log(`\n--- INICIANDO BORRADO DE DATASET ID: ${datasetId} ---`);
    
    // 1. Borrado lógico en BD
    const result = await softDeleteDatasetInDb(datasetId, accountId);
    console.log(`✅ BD Actualizada. Archivos encontrados para borrar físicamente:`, result.filesToDelete?.length || 0);

    // 2. BORRADO FÍSICO EN MINIO
    if (result.filesToDelete && result.filesToDelete.length > 0) {
      for (const file of result.filesToDelete) {
        if (file.storage_key) {
          console.log(`⏳ Intentando eliminar de MinIO el archivo con Key: "${file.storage_key}" en el Bucket: "${env.S3_BUCKET_NAME}"`);
          
          try {
            const deleteCommand = new DeleteObjectCommand({
              Bucket: env.S3_BUCKET_NAME,
              Key: file.storage_key
            });
            
            const s3Response = await s3Client.send(deleteCommand);
            console.log(`✅ ÉXITO: Archivo físico destruido en MinIO. Respuesta S3:`, s3Response.$metadata.httpStatusCode);
          } catch (s3Error: any) {
            // 👇 AQUÍ ATRAPAREMOS AL CULPABLE 👇
            console.error(`❌ FALLO CRÍTICO AL BORRAR EN MINIO:`);
            console.error(`   - Key: ${file.storage_key}`);
            console.error(`   - Código de error: ${s3Error.Code || s3Error.name}`);
            console.error(`   - Mensaje: ${s3Error.message}`);
          }
        } else {
          console.warn(`⚠️ El archivo ID ${file.aws_file_reference_id} no tiene storage_key válido.`);
        }
      }
    } else {
      console.log(`ℹ️ No se encontraron archivos vinculados a este dataset para borrar en MinIO.`);
    }

    console.log(`--- FIN DEL PROCESO ---\n`);
    return { message: `El dataset '${result.dataset.title}' fue eliminado correctamente.` };
  } catch (error: any) {
    if (error.message.includes("no encontrado")) throw new AppError(error.message, 404);
    throw error;
  }
}

// 3. Servicio para "Editar"
export async function editDataset(datasetId: number, accountId: number, input: any) {
  // Podrías reutilizar tu createDatasetSchema.parse(input) aquí si envías todos los datos
  // Para este ejemplo, pasamos los datos al repo asumiendo que el controlador los pre-validó
  try {
    const updated = await updateDatasetInDb(datasetId, accountId, input);
    return updated;
  } catch (error: any) {
    if (error.message.includes("no encontrado")) throw new AppError(error.message, 404);
    throw error;
  }
}



=======
export async function createDataset(accountId: number, isAdmin: boolean, input: any) {
  // 1. Validaciones básicas obligatorias (NOT NULL en SQL)
  if (!input.title) throw new AppError("El título del dataset es obligatorio.", 400);
  if (!input.category_id) throw new AppError("La categoría es obligatoria.", 400);
  if (!input.description) throw new AppError("La descripción es obligatoria.", 400);
  if (!input.license_id) throw new AppError("Debe seleccionar una licencia válida.", 400);

  // 2. Validación de longitud (según restricción chk_datasets_summary_length)
  if (input.summary && input.summary.length > 500) {
    throw new AppError("El resumen no puede exceder los 500 caracteres.", 400);
  }
  
  // 3. Llamamos a la función 'createFullDatasetInDb' que maneja el Dataset + Request + Files
  return await createFullDatasetInDb(accountId, isAdmin, input);
}
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
