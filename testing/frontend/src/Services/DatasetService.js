// frontend/src/Services/DatasetService.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// frontend/src/Services/DatasetService.js
export async function getDatasets({ search = "", filters = {}, page = 1, limit = 7 }) {
  try {
    const queryParams = new URLSearchParams({
      search: search || "",
      page: String(page),
      limit: String(limit)
    });

    Object.keys(filters).forEach(key => {
      const values = filters[key];
      if (Array.isArray(values) && values.length > 0) {
        // Ahora enviamos IDs: &categoria=1,4,12
        queryParams.append(key, values.join(","));
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