// src/services/news.service.ts
import { 
  createNewsPostInDb, fetchPublicNewsFromDb, fetchAllNewsAdminFromDb,
  updateNewsPostInDb, updateNewsVisibilityInDb, hardDeleteNewsPostInDb, fetchNewsCategoriesFromDb, fetchNewsDetailBySlugFromDb
} from "../repositories/news.repository";
import { pool } from "../config/db"; 
import { s3Client } from "../config/s3";
import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../config/env";
import { AppError } from "../types/app-error";
import { z } from "zod";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

const newsFileSchema = z.object({
  storage_key: z.string().min(1),
  file_url: z.string().url(),
  file_role: z.enum(['cover', 'gallery', 'attachment']).default('attachment'),
  display_name: z.string().min(1),
  file_format: z.string().refine(val => allowedFormats.includes(val.toLowerCase()), {
    message: "Solo se aceptan imágenes (jpg, png, webp) o documentos (pdf)."
  }),
  mime_type: z.string().min(1),
  file_size_bytes: z.number().int().positive(),
  display_order: z.number().int().positive().default(1)
});

const newsSchema = z.object({
  post_type: z.enum(['news', 'post']),
  title: z.string().min(1).max(255),
  summary: z.string().max(500).optional().nullable(),
  content: z.string().min(1),
  news_category_id: z.number().int().positive().optional().nullable(),
  category_id: z.number().int().positive().optional().nullable(),
  dataset_id: z.number().int().positive().optional().nullable(), 
  post_status: z.enum(['draft', 'published', 'archived', 'deleted']).default('draft'),
  access_level: z.enum(['public', 'internal']).default('public'),
  is_featured: z.boolean().default(false), 
  files: z.array(newsFileSchema).optional(),
  new_files: z.array(newsFileSchema).optional(),
  deleted_file_ids: z.array(z.number().int()).optional()
}).superRefine((data, ctx) => {
  if (data.post_type === 'news' && !data.news_category_id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Categoría de noticia obligatoria.", path: ["news_category_id"] });
  }
  if (data.post_type === 'post' && !data.category_id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Categoría general obligatoria.", path: ["category_id"] });
  }
});

// CREATE
export async function createNewsPost(newsData: any, authorId: number) {
  const validatedData = newsSchema.parse(newsData);

  if (validatedData.dataset_id) {
    const dsCheck = await pool.query(`SELECT dataset_id FROM datasets WHERE dataset_id = $1 AND deleted_at IS NULL`, [validatedData.dataset_id]);
    if (dsCheck.rowCount === 0) throw new AppError(`El dataset asociado (ID: ${validatedData.dataset_id}) no existe.`, 404);
  }

  const slug = validatedData.title.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-') + "-" + Date.now();
  
  // 👇 FIX: Aquí agregamos validatedData.files || [] como el TERCER argumento
  const result = await createNewsPostInDb(
    { ...validatedData, slug }, 
    authorId, 
    validatedData.files || []
  );
  
  return { message: "Contenido creado con éxito", newsId: result.news_post_id };
}

// UPDATE
export async function updateNewsPost(id: number, data: any, authorId: number) {
  const validatedData = newsSchema.parse(data);

  if (validatedData.dataset_id) {
    const dsCheck = await pool.query(`SELECT dataset_id FROM datasets WHERE dataset_id = $1 AND deleted_at IS NULL`, [validatedData.dataset_id]);
    if (dsCheck.rowCount === 0) throw new AppError(`El dataset asociado no existe.`, 404);
  }

  const result = await updateNewsPostInDb(id, authorId, validatedData);
  
  if (result.s3KeysToDelete && result.s3KeysToDelete.length > 0) {
    for (const key of result.s3KeysToDelete) {
       try { await s3Client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET_NAME, Key: key })); } 
       catch(e) { console.error(`❌ [S3] Error borrando imagen vieja: ${key}`); }
    }
  }
  return result.updatedPost;
}

export async function deleteNewsPost(id: number) {
  if (!id) throw new AppError("ID inválido", 400);

  // 1. Borramos en la base de datos y obtenemos las rutas de archivos
  const { s3KeysToDelete } = await hardDeleteNewsPostInDb(id);

  // 2. Limpieza física en MinIO/S3 (Sin hardcodeo, usando cliente global)
  if (s3KeysToDelete && s3KeysToDelete.length > 0) {
    const bucketName = env.S3_BUCKET_NAME;
    for (const key of s3KeysToDelete) {
      try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
        console.log(`✅ [S3] Archivo eliminado permanentemente: ${key}`);
      } catch (e: any) {
        console.error(`❌ [S3] No se pudo borrar el archivo físico: ${key}`);
      }
    }
  }

  return { message: "La noticia y todos sus archivos asociados han sido destruidos permanentemente." };
}

/**
 * Ocultar o Mostrar noticia
 */
export async function toggleNewsVisibility(id: number, hide: boolean) {
  if (!id) throw new AppError("ID inválido", 400);
  
  const result = await updateNewsVisibilityInDb(id, hide);
  const accion = hide ? "ocultada (y desmarcada como destacada)" : "publicada nuevamente";
  
  return { message: `La noticia fue ${accion}.`, data: result };
}


export async function getPublicNewsBySlug(slug: string) {
  const news = await fetchNewsDetailBySlugFromDb(slug);
  
  if (!news) {
    throw new AppError("Noticia o publicación no encontrada", 404);
  }
  
  // 🔄 Firmamos todos los archivos (portada y galería del detalle)
  if (news.files && news.files.length > 0) {
    news.files = await Promise.all(
      news.files.map(async (file: any) => {
        if (file.storage_key) {
          try {
            const command = new GetObjectCommand({ Bucket: env.S3_BUCKET_NAME, Key: file.storage_key });
            const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            
            // Reemplazamos la URL estática por la firmada
            file.file_url = presignedUrl.replace('storage:9000', 'localhost:9000');
          } catch (error) {
            console.error("Error firmando imagen de galería:", error);
          }
        }
        return file;
      })
    );
  }
  
  return news;
}

export async function getPublicNews() { 
  const newsList = await fetchPublicNewsFromDb(); 

  // 🔄 Iteramos y firmamos las portadas
  const newsFirmadas = await Promise.all(
    newsList.map(async (n: any) => {
      if (n.cover_storage_key) {
        try {
          const command = new GetObjectCommand({ Bucket: env.S3_BUCKET_NAME, Key: n.cover_storage_key });
          const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
          
          // El mismo fix de red que en instituciones
          n.cover_image = presignedUrl.replace('storage:9000', 'localhost:9000');
        } catch (error) {
          console.error("Error firmando cover de noticia:", error);
          n.cover_image = null;
        }
        delete n.cover_storage_key; // Limpiamos la variable temporal
      } else {
        n.cover_image = null;
      }
      return n;
    })
  );

  return newsFirmadas;
}
export async function getAllNewsAdmin(filters?: {
  search?: string;
  tipo?: string;
  estado?: string;
  categoria?: string;
  is_featured?: boolean;
}) {
  return await fetchAllNewsAdminFromDb(filters);
}

export async function getNewsCategories() { return await fetchNewsCategoriesFromDb();}

