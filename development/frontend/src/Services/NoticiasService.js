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