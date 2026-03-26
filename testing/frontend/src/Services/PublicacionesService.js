// src/Services/PublicacionesService.js

export const getPublications = async ({
  search = "",
  filters = {}, // { type: [], year: [] }
  page = 1,
  limit = 7
}) => {
  // Simula un delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const { publicaciones } = await import("../data/publicaciones");

  let result = publicaciones;

  // 🔎 búsqueda
  if (search) {
    const lower = search.toLowerCase();
    result = result.filter(
      pub => pub.title.toLowerCase().includes(lower) ||
             pub.description.toLowerCase().includes(lower)
    );
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (!value || value.length === 0) return;

    if (key === "type") {
      result = result.filter(pub => value.includes(pub.type));
    }

    if (key === "year") {
      result = result.filter(pub => value.includes(new Date(pub.date).getFullYear().toString()));
    }
  });

  const total = result.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginated = result.slice(start, start + limit);

  return {
    data: paginated,
    total,
    page,
    totalPages
  };
};