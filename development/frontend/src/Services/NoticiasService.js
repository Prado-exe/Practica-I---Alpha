// src/Services/NoticiasService.js

// 1. Obtener Categorías Maestras
export async function getNewsCategories() {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/news-categories`);
    const result = await response.json();
    return result.ok ? result.data : [];
  } catch (error) {
    console.error("Error cargando categorías:", error);
    return [];
  }
}

// 2. Listar Noticias (Para la página principal)
export async function getNoticias({ search = "", filters = {}, page = 1, limit = 7 }) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/news`);
    const result = await response.json();
    if (!result.ok) throw new Error("Error al obtener las noticias");

    let allNews = (result.data || []).filter(item => item.post_type === 'news');

    allNews = allNews.map(item => ({
      id: item.news_post_id,
      title: item.title,
      description: item.summary || "Sin resumen disponible.",
      category: item.category_name || "General",
      date: item.published_at || new Date().toISOString(),
      image: item.cover_image || "/img/default-news.jpg",
      slug: item.slug,
      isFeatured: item.is_featured
    }));

    if (search) {
      const lowerSearch = search.toLowerCase();
      allNews = allNews.filter(n =>
        n.title.toLowerCase().includes(lowerSearch) ||
        n.description.toLowerCase().includes(lowerSearch)
      );
    }

    if (filters.category && filters.category.length > 0) {
      const activeCat = Array.isArray(filters.category) ? filters.category : filters.category.split(",");
      allNews = allNews.filter(n => activeCat.includes(n.category));
    }

    if (filters.year && filters.year.length > 0) {
       const activeYears = Array.isArray(filters.year) ? filters.year : filters.year.split(",");
       allNews = allNews.filter(n => n.date && activeYears.includes(new Date(n.date).getFullYear().toString()));
    }

    const total = allNews.length;
    return { 
      data: allNews.slice((page - 1) * limit, page * limit), 
      total, 
      totalPages: Math.ceil(total / limit), 
      page 
    };
  } catch (error) {
    console.error("Error en getNoticias:", error);
    return { data: [], total: 0, totalPages: 0, page: 1 };
  }
}

// 3. Obtener UNA Noticia completa (Con Portada y Galería)
export async function getNoticiaBySlug(slug) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/news/${slug}`);
    const result = await response.json();
    
    if (!result.ok) throw new Error("Noticia no encontrada");
    
    const item = result.data;
    const allFiles = item.files || [];

    return {
      id: item.news_post_id,
      title: item.title,
      content: item.content,
      category: item.category_name,
      date: item.published_at || item.created_at,
      // Buscamos la imagen marcada como 'cover', si no hay, imagen por defecto
      cover: allFiles.find(f => f.file_role === 'cover')?.file_url || "/img/default-news.jpg",
      // Extraemos solo las URLs de las imágenes marcadas como 'gallery'
      gallery: allFiles.filter(f => f.file_role === 'gallery').map(f => f.file_url)
    };
  } catch (error) {
    console.error("Error en getNoticiaBySlug:", error);
    return null;
  }
}