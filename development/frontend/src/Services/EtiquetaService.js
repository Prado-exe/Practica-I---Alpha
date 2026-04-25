const API_URL = import.meta.env.VITE_API_URL || "http://3.139.202.192:3000";

export async function getTags() {
  try {
    const response = await fetch(`${API_URL}/api/tags`); // Ajusta la ruta
    if (!response.ok) throw new Error("Error obteniendo tags");
    const json = await response.json();
    return json.data || json;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getLicencias() {
  try {
    const response = await fetch(`${API_URL}/api/licenses`); // Ajusta la ruta
    if (!response.ok) throw new Error("Error obteniendo licencias");
    const json = await response.json();
    return json.data || json;
  } catch (error) {
    console.error(error);
    return [];
  }
}