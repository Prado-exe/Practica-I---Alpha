// src/Services/InstitucionesService.js
export const getInstituciones = async ({
  search = "",
  page = 1,
  limit = 9
} = {}) => {
  await new Promise(resolve => setTimeout(resolve, 300));

  const { instituciones: allInstituciones } = await import("../data/InstitucionesData");

  let result = [...allInstituciones];

  // 🔎 búsqueda
  if (search) {
    result = result.filter(inst =>
      inst.nombre.toLowerCase().includes(search.toLowerCase())
    );
  }

  const total = result.length;

  // 📄 paginación
  const paginated = result.slice((page - 1) * limit, page * limit);

  return {
    data: paginated,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};