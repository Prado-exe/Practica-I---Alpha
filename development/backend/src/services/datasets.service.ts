// En src/services/datasets.service.ts
import { createFullDatasetInDb, recordDatasetEvent, fetchDatasetsPaginated } from "../repositories/datasets.repository";
import { z } from "zod";

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
  const result = await fetchDatasetsPaginated(accountId, isAdmin, search, limit, offset);
  
  return {
    total: result.total,
    totalPages: Math.ceil(result.total / limit),
    data: result.data
  };
}





