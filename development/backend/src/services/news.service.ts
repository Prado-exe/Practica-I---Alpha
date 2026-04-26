import {
  createNewsPostInDb,
  fetchPublicNewsFromDb,
  fetchAllNewsAdminFromDb,
  updateNewsPostInDb,
  softDeleteNewsPostInDb,
  insertNewsFileInDb,
  fetchCarouselSlidesFromDb,
  fetchAllCarouselSlidesAdminFromDb,
  createCarouselSlideInDb,
  updateCarouselSlideInDb
} from "../repositories/news.repository";

import { AppError } from "../types/app-error";


// =====================================================
// CREATE
// =====================================================
export async function createNewsPost(newsData: any, authorId: number) {

  if (!newsData.title || !newsData.content) {
    throw new AppError("Título y contenido son obligatorios", 400);
  }

  if (!authorId) {
    throw new AppError("Autor inválido", 400);
  }

  // 🔥 Validación clave según tu BD
  if (newsData.post_type === "news" && !newsData.news_category_id) {
    throw new AppError("news_category_id es obligatorio para noticias", 400);
  }

  if (newsData.post_type === "post" && !newsData.category_id) {
    throw new AppError("category_id es obligatorio para publicaciones", 400);
  }

  // 🔹 slug único básico
  const slug = newsData.slug || newsData.title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') + "-" + Date.now();

  const result = await createNewsPostInDb(
    { ...newsData, slug },
    authorId,
    newsData.files || []
  );

  return {
    message: "Noticia creada con éxito",
    newsId: result.news_post_id
  };
}


// =====================================================
// GET PUBLIC
// =====================================================
export async function getPublicNews() {
  return await fetchPublicNewsFromDb();
}


// =====================================================
// GET ADMIN (🔥 CLAVE PARA TU PROBLEMA)
// =====================================================
export async function getAllNewsAdmin() {
  return await fetchAllNewsAdminFromDb();
}


// =====================================================
// UPDATE
// =====================================================
export async function updateNewsPost(id: number, data: any) {

  if (!id) {
    throw new AppError("ID inválido", 400);
  }

  if (!data.title || !data.content) {
    throw new AppError("Título y contenido son obligatorios", 400);
  }

  return await updateNewsPostInDb(id, data);
}


// =====================================================
// DELETE (SOFT)
// =====================================================
export async function softDeleteNewsPost(id: number) {

  if (!id) {
    throw new AppError("ID inválido", 400);
  }

  return await softDeleteNewsPostInDb(id);
}


// =====================================================
// CAROUSEL
// =====================================================
export async function getCarouselSlides() {
  return await fetchCarouselSlidesFromDb();
}

export async function getAllCarouselSlidesAdmin() {
  return await fetchAllCarouselSlidesAdminFromDb();
}

export async function createCarouselSlide(data: any, authorId: number) {
  if (!data.title) throw new AppError("Título obligatorio", 400);

  // Remove accents then non-word characters to build a clean slug
  const slug = data.title
    .toLowerCase()
    .trim()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") + "-" + Date.now();

  return await createCarouselSlideInDb({ ...data, slug }, authorId);
}

export async function updateCarouselSlide(id: number, data: any) {
  if (!id) throw new AppError("ID inválido", 400);
  if (!data.title) throw new AppError("Título obligatorio", 400);
  return await updateCarouselSlideInDb(id, data);
}

export async function deleteCarouselSlide(id: number) {
  if (!id) throw new AppError("ID inválido", 400);
  return await softDeleteNewsPostInDb(id);
}


// =====================================================
// FILES (🔥 para news_post_files)
// =====================================================
export async function addFileToNewsPost(data: any) {

  if (!data.news_post_id || !data.aws_file_reference_id) {
    throw new AppError("Datos de archivo incompletos", 400);
  }

  // Validación del CHECK de tu BD
  const validRoles = ["cover", "gallery", "attachment"];
  if (!validRoles.includes(data.file_role)) {
    throw new AppError("file_role inválido", 400);
  }

  return await insertNewsFileInDb({
    news_post_id: data.news_post_id,
    aws_file_reference_id: data.aws_file_reference_id,
    file_role: data.file_role,
    display_order: data.display_order || 1
  });
}
