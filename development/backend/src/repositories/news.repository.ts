import { pool } from "../config/db";


// =====================================================
// CREATE (🔥 FIX IMPORTANTE)
// =====================================================
export async function createNewsPostInDb(
  newsData: any,
  authorAccountId: number,
  fileReferences: any[]
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const newsResult = await client.query(`
      INSERT INTO news_posts (
        author_account_id,
        post_type,
        title,
        slug,
        summary,
        content,
        news_category_id,
        category_id, -- 👈 AGREGADO
        post_status,
        access_level,
        published_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING news_post_id
    `, [
      authorAccountId,
      newsData.post_type,
      newsData.title,
      newsData.slug,
      newsData.summary,
      newsData.content,

      // 🔥 lógica correcta según BD
      newsData.post_type === "news" ? newsData.news_category_id : null,
      newsData.post_type === "post" ? newsData.category_id : null,

      newsData.post_status || "draft",
      newsData.access_level || "public",
      newsData.post_status === "published" ? new Date() : null
    ]);

    const newsPostId = newsResult.rows[0].news_post_id;

    // 🔹 archivos
    if (fileReferences?.length) {
      for (const file of fileReferences) {
        await client.query(`
          INSERT INTO news_post_files 
          (news_post_id, aws_file_reference_id, file_role, display_order)
          VALUES ($1,$2,$3,$4)
        `, [
          newsPostId,
          file.aws_file_reference_id,
          file.file_role || "attachment",
          file.display_order || 1
        ]);
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
// PUBLIC (YA LO TENÍAS BIEN)
// =====================================================
export async function fetchPublicNewsFromDb() {
  const result = await pool.query(`
    SELECT 
      n.news_post_id,
      n.title,
      n.slug,
      n.summary,
      n.published_at,
      c.name as category_name,

      (SELECT file_url 
       FROM aws_file_references a 
       JOIN news_post_files nf 
         ON a.aws_file_reference_id = nf.aws_file_reference_id 
       WHERE nf.news_post_id = n.news_post_id 
         AND nf.file_role = 'cover' 
       LIMIT 1) as cover_image

    FROM news_posts n
    LEFT JOIN news_categories c 
      ON n.news_category_id = c.news_category_id

    WHERE n.post_status = 'published'
      AND n.deleted_at IS NULL

    ORDER BY n.published_at DESC
  `);

  return result.rows;
}


// =====================================================
// 🔥 ADMIN (NUEVO - CLAVE)
// =====================================================
export async function fetchAllNewsAdminFromDb() {
  const result = await pool.query(`
    SELECT 
      n.*,
      c.name as news_category_name

    FROM news_posts n
    LEFT JOIN news_categories c 
      ON n.news_category_id = c.news_category_id

    WHERE n.deleted_at IS NULL

    ORDER BY n.created_at DESC
  `);

  return result.rows;
}


// =====================================================
// UPDATE
// =====================================================
export async function updateNewsPostInDb(id: number, data: any) {
  const result = await pool.query(`
    UPDATE news_posts
    SET 
      title = $1,
      content = $2,
      summary = $3,
      post_status = $4,
      updated_at = NOW(),
      published_at = CASE 
        WHEN $4 = 'published' THEN NOW()
        ELSE published_at
      END
    WHERE news_post_id = $5
    RETURNING *
  `, [
    data.title,
    data.content,
    data.summary,
    data.post_status,
    id
  ]);

  return result.rows[0];
}


// =====================================================
// DELETE (SOFT)
// =====================================================
export async function softDeleteNewsPostInDb(id: number) {
  return pool.query(`
    UPDATE news_posts
    SET deleted_at = NOW()
    WHERE news_post_id = $1
  `, [id]);
}


// =====================================================
// CAROUSEL - PUBLIC
// =====================================================
export async function fetchCarouselSlidesFromDb() {
  try {
    const result = await pool.query(`
      SELECT
        n.news_post_id,
        n.title,
        n.slug,
        n.summary,
        n.content,
        n.image_url,
        n.link_url,
        n.published_at
      FROM news_posts n
      JOIN news_categories nc ON n.news_category_id = nc.news_category_id
      WHERE nc.name = 'carrusel'
        AND n.post_status = 'published'
        AND n.deleted_at IS NULL
      ORDER BY n.published_at DESC, n.created_at DESC
      LIMIT 8
    `);
    return result.rows;
  } catch (err: any) {
    // Si la migración 041 no se ha ejecutado aún (column does not exist)
    if (err.code === '42703' || err.code === '42P01') return [];
    throw err;
  }
}


// =====================================================
// CAROUSEL - ADMIN (all statuses)
// =====================================================
export async function fetchAllCarouselSlidesAdminFromDb() {
  try {
    const result = await pool.query(`
      SELECT
        n.news_post_id,
        n.title,
        n.slug,
        n.summary,
        n.content,
        n.image_url,
        n.link_url,
        n.post_status,
        n.published_at,
        n.created_at
      FROM news_posts n
      JOIN news_categories nc ON n.news_category_id = nc.news_category_id
      WHERE nc.name = 'carrusel'
        AND n.deleted_at IS NULL
      ORDER BY n.created_at DESC
    `);
    return result.rows;
  } catch (err: any) {
    if (err.code === '42703' || err.code === '42P01') return [];
    throw err;
  }
}


// =====================================================
// CAROUSEL - CREATE
// =====================================================
export async function createCarouselSlideInDb(data: any, authorAccountId: number) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const catResult = await client.query(
      `SELECT news_category_id FROM news_categories WHERE name = 'carrusel' LIMIT 1`
    );
    if (!catResult.rows[0]) throw new Error("Categoría carrusel no encontrada. Ejecuta la migración 041.");
    const carruselCategoryId = catResult.rows[0].news_category_id;

    const result = await client.query(`
      INSERT INTO news_posts (
        author_account_id, post_type, title, slug, summary, content,
        news_category_id, post_status, access_level, image_url, link_url, published_at
      ) VALUES ($1, 'news', $2, $3, $4, $5, $6, $7, 'public', $8, $9, $10)
      RETURNING news_post_id
    `, [
      authorAccountId,
      data.title,
      data.slug,
      data.summary || null,
      data.content || '',
      carruselCategoryId,
      data.post_status || 'draft',
      data.image_url || null,
      data.link_url || null,
      data.post_status === 'published' ? new Date() : null
    ]);

    await client.query("COMMIT");
    return { news_post_id: result.rows[0].news_post_id };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}


// =====================================================
// CAROUSEL - UPDATE
// =====================================================
export async function updateCarouselSlideInDb(id: number, data: any) {
  const result = await pool.query(`
    UPDATE news_posts
    SET
      title       = COALESCE($1, title),
      summary     = $2,
      content     = COALESCE($3, content),
      image_url   = $4,
      link_url    = $5,
      post_status = COALESCE($6, post_status),
      updated_at  = NOW(),
      published_at = CASE
        WHEN $6 = 'published' AND published_at IS NULL THEN NOW()
        ELSE published_at
      END
    WHERE news_post_id = $7
    RETURNING news_post_id, title, summary, content, image_url, link_url, post_status, published_at
  `, [data.title, data.summary || null, data.content, data.image_url || null, data.link_url || null, data.post_status, id]);
  return result.rows[0];
}


// =====================================================
// FILES (SEPARADO)
// =====================================================
export async function insertNewsFileInDb(data: any) {
  return pool.query(`
    INSERT INTO news_post_files
    (news_post_id, aws_file_reference_id, file_role, display_order)
    VALUES ($1,$2,$3,$4)
  `, [
    data.news_post_id,
    data.aws_file_reference_id,
    data.file_role,
    data.display_order || 1
  ]);
}