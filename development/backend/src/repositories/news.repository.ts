// src/repositories/news.repository.ts
import { pool } from "../config/db";

export async function createNewsPostInDb(newsData: any, authorAccountId: number, fileReferences: any[]) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const newsResult = await client.query(`
      INSERT INTO news_posts (
        author_account_id, post_type, title, slug, summary, content,
        news_category_id, category_id, post_status, access_level, published_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING news_post_id
    `, [
      authorAccountId, newsData.post_type, newsData.title, newsData.slug, newsData.summary, newsData.content,
      newsData.post_type === "news" ? newsData.news_category_id : null,
      newsData.post_type === "post" ? newsData.category_id : null,
      newsData.post_status || "draft", newsData.access_level || "public",
      newsData.post_status === "published" ? new Date() : null
    ]);

    const newsPostId = newsResult.rows[0].news_post_id;

    // 🔥 FIX: Primero insertamos en aws_file_references, luego en news_post_files
    if (fileReferences && fileReferences.length > 0) {
      for (const file of fileReferences) {
        // 1. Registrar en la tabla maestra de archivos
        const fileRes = await client.query(`
          INSERT INTO aws_file_references (
            storage_key, file_url, file_format_id, file_size_bytes, mime_type, file_category, owner_account_id
          ) VALUES (
            $1, $2, COALESCE((SELECT file_format_id FROM file_formats WHERE mime_type = $3 LIMIT 1), 1), 
            $4, $3, 'news_post', $5
          ) RETURNING aws_file_reference_id
        `, [file.storage_key, file.file_url, file.mime_type, file.file_size_bytes, authorAccountId]);
        
        const aws_file_id = fileRes.rows[0].aws_file_reference_id;

        // 2. Vincular el archivo a la noticia
        await client.query(`
          INSERT INTO news_post_files (news_post_id, aws_file_reference_id, file_role, display_order)
          VALUES ($1, $2, $3, $4)
        `, [newsPostId, aws_file_id, file.file_role || "attachment", file.display_order || 1]);
      }
    }

    await client.query("COMMIT");
    return { news_post_id: newsPostId };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// =====================================================
// UPDATE
// =====================================================
export async function updateNewsPostInDb(id: number, authorAccountId: number, data: any) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Actualizar la publicación principal
    // 🔥 FIX: Usamos $10 en el CASE WHEN y lo pasamos al final del arreglo
    const result = await client.query(`
      UPDATE news_posts SET 
        title = $1, content = $2, summary = $3, post_status = $4, is_featured = $5,
        news_category_id = $6, category_id = $7, dataset_id = $8, updated_at = NOW(),
        published_at = CASE WHEN $10 = 'published' AND published_at IS NULL THEN NOW() ELSE published_at END
      WHERE news_post_id = $9
      RETURNING *
    `, [
      data.title,                                                // $1
      data.content,                                              // $2
      data.summary,                                              // $3
      data.post_status,                                          // $4
      data.is_featured || false,                                 // $5
      data.post_type === "news" ? data.news_category_id : null,  // $6
      data.post_type === "post" ? data.category_id : null,       // $7
      data.dataset_id || null,                                   // $8
      id,                                                        // $9
      data.post_status                                           // $10
    ]);

    if (result.rowCount === 0) throw new Error("Noticia no encontrada");

    // 2. Insertar nuevos archivos de la edición (Portada y Galería)
    if (data.files && data.files.length > 0) {
      for (const file of data.files) {
        const fileRes = await client.query(`
          INSERT INTO aws_file_references (storage_key, file_url, file_format_id, file_size_bytes, mime_type, file_category, owner_account_id) 
          VALUES ($1, $2, COALESCE((SELECT file_format_id FROM file_formats WHERE mime_type = $3 LIMIT 1), 1), $4, $3, 'news_post', $5) 
          RETURNING aws_file_reference_id
        `, [file.storage_key, file.file_url, file.mime_type, file.file_size_bytes, authorAccountId]);
        
        await client.query(`
          INSERT INTO news_post_files (news_post_id, aws_file_reference_id, file_role, display_order)
          VALUES ($1, $2, $3, $4)
        `, [id, fileRes.rows[0].aws_file_reference_id, file.file_role || "attachment", file.display_order || 1]);
      }
    }

    // 3. Eliminar archivos viejos
    let s3KeysToDelete: string[] = [];
    if (data.deleted_file_ids && data.deleted_file_ids.length > 0) {
      const keysRes = await client.query(`SELECT storage_key FROM aws_file_references WHERE aws_file_reference_id = ANY($1::bigint[])`, [data.deleted_file_ids]);
      s3KeysToDelete = keysRes.rows.map((r: any) => r.storage_key);

      await client.query(`DELETE FROM aws_file_references WHERE aws_file_reference_id = ANY($1::bigint[])`, [data.deleted_file_ids]);
    }

    await client.query("COMMIT");
    return { updatedPost: result.rows[0], s3KeysToDelete };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function hardDeleteNewsPostInDb(id: number) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Obtenemos las llaves de S3 antes de borrar nada para la limpieza física
    const keysRes = await client.query(`
      SELECT a.storage_key, a.aws_file_reference_id 
      FROM news_post_files n 
      JOIN aws_file_references a ON n.aws_file_reference_id = a.aws_file_reference_id 
      WHERE n.news_post_id = $1
    `, [id]);
    
    const s3KeysToDelete = keysRes.rows.map(r => r.storage_key);
    const fileIds = keysRes.rows.map(r => r.aws_file_reference_id);

    // 2. DESTRUCCIÓN TOTAL: Borramos la noticia (Esto dispara el CASCADE)
    await client.query(`DELETE FROM news_posts WHERE news_post_id = $1`, [id]);

    // 3. Limpiamos las referencias maestras de archivos para no dejar basura
    if (fileIds.length > 0) {
      await client.query(`DELETE FROM aws_file_references WHERE aws_file_reference_id = ANY($1::bigint[])`, [fileIds]);
    }

    await client.query("COMMIT");
    return { s3KeysToDelete };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Descripción: Cambia el estado de visibilidad sin borrar el dato.
 */
export async function updateNewsVisibilityInDb(id: number, isHidden: boolean) {
  const newStatus = isHidden ? 'archived' : 'published';
  const result = await pool.query(`
    UPDATE news_posts 
    SET 
      post_status = $1, 
      updated_at = NOW(),
      is_featured = CASE WHEN $1 = 'archived' THEN false ELSE is_featured END
    WHERE news_post_id = $2
    RETURNING news_post_id, post_status, is_featured
  `, [newStatus, id]);
  
  if (result.rowCount === 0) throw new Error("Noticia no encontrada");
  return result.rows[0];
}

export async function fetchPublicNewsFromDb() {
  const result = await pool.query(`
    SELECT n.news_post_id, n.title, n.slug, n.summary, n.published_at, n.is_featured, n.post_type, 
      COALESCE(nc.name, c.name) as category_name, 
      (SELECT storage_key FROM aws_file_references a JOIN news_post_files nf ON a.aws_file_reference_id = nf.aws_file_reference_id 
       WHERE nf.news_post_id = n.news_post_id AND nf.file_role = 'cover' LIMIT 1) as cover_storage_key
    FROM news_posts n
    LEFT JOIN news_categories nc ON n.news_category_id = nc.news_category_id
    LEFT JOIN categories c ON n.category_id = c.category_id
    WHERE n.post_status = 'published' AND n.deleted_at IS NULL
    ORDER BY n.is_featured DESC, n.published_at DESC
  `);
  return result.rows;
}

export async function fetchAllNewsAdminFromDb() {
  const result = await pool.query(`
    SELECT n.*, c.name as news_category_name
    FROM news_posts n
    LEFT JOIN news_categories c ON n.news_category_id = c.news_category_id
    WHERE n.deleted_at IS NULL
    ORDER BY n.created_at DESC
  `);
  return result.rows;
}

export async function fetchNewsCategoriesFromDb() {
  const result = await pool.query(`
    SELECT news_category_id, name 
    FROM news_categories 
    ORDER BY name ASC
  `);
  return result.rows;
}

// En src/repositories/news.repository.ts

export async function fetchNewsDetailBySlugFromDb(slug: string) {
  const postRes = await pool.query(`
    SELECT n.*, 
      COALESCE(nc.name, c.name) as category_name
    FROM news_posts n
    LEFT JOIN news_categories nc ON n.news_category_id = nc.news_category_id
    LEFT JOIN categories c ON n.category_id = c.category_id
    WHERE n.slug = $1 AND n.post_status = 'published' AND n.deleted_at IS NULL
  `, [slug]);
  
  if (postRes.rowCount === 0) return null;
  const post = postRes.rows[0];

  const filesRes = await pool.query(`
    SELECT a.storage_key, a.file_url, nf.file_role, nf.display_order
    FROM aws_file_references a
    JOIN news_post_files nf ON a.aws_file_reference_id = nf.aws_file_reference_id
    WHERE nf.news_post_id = $1
    ORDER BY nf.display_order ASC
  `, [post.news_post_id]);
  
  post.files = filesRes.rows;
  return post;
}