// frontend/src/Services/DatasetService.js
const API_URL = import.meta.env.VITE_API_URL || "http://3.139.202.192:3000";

export async function getDatasets({ search = "", filters = {}, page = 1, limit = 7 }) {
  try {
    const queryParams = new URLSearchParams();

    // Agregamos el buscador de texto
    if (search) queryParams.append("search", search);
    
    // Paginación
    queryParams.append("page", String(page));
    queryParams.append("limit", String(limit));

    // Procesamos los filtros dinámicos
    Object.keys(filters).forEach(key => {
      const values = filters[key];
      
      // Si el filtro es un arreglo (ej: Múltiples categorías)
      if (Array.isArray(values) && values.length > 0) {
        queryParams.append(key, values.join(","));
      } 
      // Si el filtro es un texto plano directo
      else if (values && typeof values === 'string' && values.trim() !== '') {
        queryParams.append(key, values);
      }
    });

    const response = await fetch(`${API_URL}/api/public/datasets?${queryParams.toString()}`);
    const json = await response.json();
    return {
      total: json.total || 0,
      totalPages: json.totalPages || 1,
      data: json.data || []
    };
  } catch (error) {
    return { data: [], total: 0, totalPages: 1 };
  }
}

export async function getPublicDatasetById(id) {
  try {
    const response = await fetch(`${API_URL}/api/public/datasets/${id}`);
    if (!response.ok) throw new Error("Error obteniendo detalles del dataset");
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error("Error en getPublicDatasetById:", error);
    return null;
  }
}