const API_URL = import.meta.env.VITE_API_URL || "http://3.139.202.192:3000";

export async function getDashboardStats(token) {
  const res = await fetch(`${API_URL}/api/dashboard/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Error al cargar estadísticas del dashboard");
  return res.json();
}
