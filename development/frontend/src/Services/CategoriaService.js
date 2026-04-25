const API_URL = import.meta.env.VITE_API_URL || "http://3.139.202.192:3000";

export async function getCategorias() {
  try {
    const response = await fetch(`${API_URL}/api/categories`); // Ajusta la ruta si es diferente
    if (!response.ok) throw new Error("Error obteniendo categorías");
    const json = await response.json();
    return json.data || json; // Dependiendo de si tu backend envuelve en { data: [...] }
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getOds() {
  try {
    const response = await fetch(`${API_URL}/api/ods`); // Ajusta la ruta
    if (!response.ok) throw new Error("Error obteniendo ODS");
    const json = await response.json();
    return json.data || json;
  } catch (error) {
    console.error(error);
    return [];
  }
}