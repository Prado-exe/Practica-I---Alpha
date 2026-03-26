import { fetchInstitutionsFromDb, createInstitutionInDb, updateInstitutionInDb, deleteInstitutionFromDb, fetchPublicInstitutionsPaginated} from "../repositories/instituciones.repository";
import { AppError } from "../types/app-error";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { s3Client } from "../config/s3"; 
import { env } from "../config/env";

export async function getInstitutions() {
  const instituciones = await fetchInstitutionsFromDb();

  const institucionesFirmadas = await Promise.all(
    instituciones.map(async (inst: any) => {
      if (inst.storage_key) {
        try {
          const command = new GetObjectCommand({ Bucket: env.S3_BUCKET_NAME, Key: inst.storage_key });
          const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
          return { ...inst, logo_url: presignedUrl }; 
        } catch (error) {
          console.error(`Error firmando URL:`, error);
          return inst;
        }
      }
      return inst;
    })
  );

  return institucionesFirmadas;
}

export async function getPublicInstitutions(search: string = "", page: number = 1, limit: number = 9) {
  const offset = (page - 1) * limit;
  
  // Asumiendo que agregaste fetchPublicInstitutionsPaginated a tu repository
  const result = await fetchPublicInstitutionsPaginated(search, limit, offset);

  const institucionesFirmadas = await Promise.all(
    result.data.map(async (inst: any) => {
      if (inst.storage_key) {
        try {
          const command = new GetObjectCommand({ Bucket: env.S3_BUCKET_NAME, Key: inst.storage_key });
          const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
          return { ...inst, logo_url: presignedUrl }; 
        } catch (error) {
          return inst; 
        }
      }
      return inst;
    })
  );

  return {
    total: result.total,
    totalPages: Math.ceil(result.total / limit),
    data: institucionesFirmadas
  };
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

