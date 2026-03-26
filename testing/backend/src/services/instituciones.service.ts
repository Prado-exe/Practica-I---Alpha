import { fetchInstitutionsFromDb, createInstitutionInDb, updateInstitutionInDb, deleteInstitutionFromDb} from "../repositories/instituciones.repository";
import { AppError } from "../types/app-error";

export async function getInstitutions() {
  return await fetchInstitutionsFromDb();
}

export async function addInstitution(instData: any, fileData: any, accountId: number) {
  // Validaciones estrictas basadas en tus tablas y UI
  if (!instData.legal_name || !instData.institution_type || !instData.country_name || !instData.description || !instData.data_role) {
    throw new AppError("Faltan campos obligatorios de la institución.", 400);
  }
  
  if (instData.description.length > 1000) {
    throw new AppError("La descripción no puede superar los 1000 caracteres.", 400);
  }

  if (!fileData || !fileData.storage_key || !fileData.file_url) {
    throw new AppError("Los datos de la imagen (logo) son obligatorios.", 400);
  }

  return await createInstitutionInDb(instData, fileData, accountId);
}

export async function editInstitution(id: number, instData: any, fileData: any, accountId: number) {
  if (!instData.legal_name || !instData.institution_type || !instData.country_name || !instData.description || !instData.data_role) {
    throw new AppError("Faltan campos obligatorios de la institución.", 400);
  }
  
  if (instData.description.length > 1000) {
    throw new AppError("La descripción no puede superar los 1000 caracteres.", 400);
  }

  // Nota: fileData puede ser null si no cambió la imagen, el repositorio lo maneja.
  const updated = await updateInstitutionInDb(id, instData, fileData, accountId);
  return updated;
}

export async function removeInstitution(id: number) {
  const deletedCount = await deleteInstitutionFromDb(id);
  if (deletedCount === 0) {
    throw new AppError("Institución no encontrada", 404);
  }
  return { message: "Institución eliminada correctamente" };
}