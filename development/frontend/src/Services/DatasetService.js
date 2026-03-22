// src/services/datasetService.js

// 🔥 SIMULACIÓN (mock)
export const getDatasets = async ({
  search = "",
  filters = {},
  page = 1,
  limit = 7
}) => {

  await new Promise(resolve => setTimeout(resolve, 400));

  const { datasets } = await import("../data/Datasets");

  let result = datasets;

  // 🔎 búsqueda
  if (search) {
    result = result.filter(ds =>
      ds.title.toLowerCase().includes(search.toLowerCase())
    );
  }

  // 🔎 filtros
  Object.entries(filters).forEach(([key, value]) => {
    if (!value) return;

    result = result.filter(ds => {
      if (key === "fecha") return ds.updated === value;
      return ds[key]?.includes(value);
    });
  });

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