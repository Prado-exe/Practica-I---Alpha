// frontend/src/Services/InstitucionesService.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function getInstituciones({ search = "", page = 1, limit = 9 }) {
  try {
    // URLSearchParams requiere strings, así que convertimos los números
    const queryParams = new URLSearchParams({ 
      search, 
      page: String(page), 
      limit: String(limit) 
    });
    
    const response = await fetch(`${API_URL}/api/public/instituciones?${queryParams.toString()}`);
    
    if (!response.ok) throw new Error("Error obteniendo instituciones");
    
    const json = await response.json();
    
    return {
      total: json.total || 0,
      totalPages: json.totalPages || 1,
      data: json.data || []
    };
    
  } catch (error) {
    console.error("Error de conexión:", error);
    return { data: [], total: 0, totalPages: 1 };
  }
}