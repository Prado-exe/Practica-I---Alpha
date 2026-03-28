// En src/services/datasets.service.ts
import { z } from "zod";
import { createFullDatasetInDb, fetchDatasetsPaginated } from "../repositories/datasets.repository";

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
  title: z.string().min(1, "El título del dataset es obligatorio."),
  category_id: z.number().int().positive("La categoría es obligatoria."),
  institution_id: z.number().int().positive().optional().nullable(),
  license_id: z.number().int().positive("Debe seleccionar una licencia válida."),
  ods_objective_id: z.number().int().positive().optional().nullable(),
  summary: z.string().max(500, "El resumen no puede exceder los 500 caracteres.").optional().nullable(),
  description: z.string().min(1, "La descripción es obligatoria."),
  access_level: z.enum(['public', 'internal']).default('public'),
  files: z.array(fileSchema).min(1, "Debe subir al menos un archivo para el dataset.")
});

export async function createDataset(accountId: number, isAdmin: boolean, input: any) {
  // Ahora Zod aceptará el storage_key y file_url perfectamente
  const validatedData = createDatasetSchema.parse(input);
  
  return await createFullDatasetInDb(accountId, isAdmin, validatedData);
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



