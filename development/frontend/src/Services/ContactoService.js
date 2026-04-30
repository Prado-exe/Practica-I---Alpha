// src/Services/ContactoService.js

// --- PARTE PÚBLICA ---
export async function enviarMensajeContacto(formData) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    const result = await response.json();
    return { ok: response.ok, message: result.message };
  } catch (error) {
    return { ok: false, message: "Error de conexión." };
  }
}

// --- PARTE PRIVADA (ADMIN) ---
export async function getMensajesContacto(token) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contact`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await response.json();
    return result.ok ? result.data : [];
  } catch (error) {
    console.error("Error al obtener mensajes:", error);
    return [];
  }
}

export async function marcarMensajeLeido(id, token) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contact/${id}/read`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${token}` }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function eliminarMensajeContacto(id, token) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contact/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function getMensajeById(id, token) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contact/${id}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await response.json();
    return result.ok ? result.data : null;
  } catch (error) {
    return null;
  }
}