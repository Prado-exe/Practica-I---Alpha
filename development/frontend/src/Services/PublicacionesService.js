// src/Services/PublicacionesService.js

// 1. Obtener Categorías Maestras (Generales)
export async function getCategories() {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
    const result = await response.json();
    return result.ok ? result.data : [];
  } catch (error) {
    console.error("Error cargando categorías:", error);
    return [];
  }
}

// 2. Obtener lista de Publicaciones
export const getPublications = async ({ search = "", filters = {}, page = 1, limit = 7 }) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/news`);
    const result = await response.json();

    if (!result.ok) throw new Error("Error al obtener las publicaciones");

    let allPosts = (result.data || []).filter(item => item.post_type === 'post');

    allPosts = allPosts.map(item => ({
      id: item.news_post_id,
      title: item.title,
      description: item.summary || "Sin resumen disponible.",
      type: item.category_name || "Documento",
      date: item.published_at || new Date().toISOString(),
      image: item.cover_image || "/img/default-publication.jpg",
      slug: item.slug,
      isFeatured: item.is_featured
    }));

    if (search) {
      const lowerSearch = search.toLowerCase();
      allPosts = allPosts.filter(pub =>
        pub.title.toLowerCase().includes(lowerSearch) ||
        pub.description.toLowerCase().includes(lowerSearch)
      );
    }

    if (filters.type && filters.type.length > 0) {
      const activeTypes = Array.isArray(filters.type) ? filters.type : filters.type.split(",");
      allPosts = allPosts.filter(pub => activeTypes.includes(pub.type));
    }

    if (filters.year && filters.year.length > 0) {
      const activeYears = Array.isArray(filters.year) ? filters.year : filters.year.split(",");
      allPosts = allPosts.filter(pub => {
        if (!pub.date) return false;
        return activeYears.includes(new Date(pub.date).getFullYear().toString());
      });
    }

    const total = allPosts.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;

    return { data: allPosts.slice(start, start + limit), total, page, totalPages };

  } catch (error) {
    console.error("❌ Error en getPublications:", error);
    return { data: [], total: 0, totalPages: 0, page: 1 };
  }
};

// 3. Obtener UNA Publicación por Slug (Para el Leer Más)
export async function getPublicationBySlug(slug) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/news/${slug}`);
    const result = await response.json();
    
    if (!result.ok) throw new Error("Publicación no encontrada");
    
    const item = result.data;
    const allFiles = item.files || [];

    return {
      id: item.news_post_id,
      title: item.title,
      content: item.content,
      type: item.category_name || "Documento",
      date: item.published_at || item.created_at,
      cover: allFiles.find(f => f.file_role === 'cover')?.file_url || "/img/default-publication.jpg",
      gallery: allFiles.filter(f => f.file_role === 'gallery').map(f => f.file_url)
    };
  } catch (error) {
    console.error("Error en getPublicationBySlug:", error);
    return null;
  }
}