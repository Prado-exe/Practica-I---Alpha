// 🔍 FILTRAR
export function filterNews(noticias, { searchQuery, selectedCategories, selectedYears }) {
  return noticias.filter((news) => {
    const matchesSearch =
      news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      news.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(news.category);

    const newsYear = new Date(news.date).getFullYear().toString();
    const matchesYear =
      selectedYears.length === 0 || selectedYears.includes(newsYear);

    return matchesSearch && matchesCategory && matchesYear;
  });
}

// 📄 PAGINAR (ya no lo usará el componente directamente)
export function paginate(array, currentPage, itemsPerPage) {
  const totalPages = Math.ceil(array.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return {
    currentItems: array.slice(startIndex, endIndex),
    totalPages,
    startIndex,
    endIndex
  };
}

// 🔥 👉 NUEVA FUNCIÓN PARA EL HOOK
export async function getNoticias({
  search = "",
  filters = {},
  page = 1,
  limit = 7
}) {

  // simula API
  await new Promise(res => setTimeout(res, 200));

  const { noticias } = await import("../data/noticias");

  // 🔹 adaptar filtros del hook
  const selectedCategories = filters.category
    ? filters.category.split(",")
    : [];

  const selectedYears = filters.year
    ? filters.year.split(",")
    : [];

  // 🔹 reutilizas tu lógica existente
  const filtered = filterNews(noticias, {
    searchQuery: search,
    selectedCategories,
    selectedYears
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);

  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return {
    data,
    total,
    totalPages
  };
}