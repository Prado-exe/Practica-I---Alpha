import { createFullDatasetInDb, fetchDatasetsPaginated } from "../repositories/datasets.repository";
import { AppError } from "../types/app-error"; 

export async function getDatasets(accountId: number, isAdmin: boolean, search: string = "", page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;
  
  // Llamamos a la función con el nombre correcto del repositorio
  const result = await fetchDatasetsPaginated(accountId, isAdmin, search, limit, offset);
  
  return {
    total: result.total,
    totalPages: Math.ceil(result.total / limit),
    data: result.data
  };
}

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
