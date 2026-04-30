import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

export function useFetchList(fetchFunction, options = {}) {

  const {
    initialFilters = {},
    limit = 7,
    debounceTime = 300
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();
  const abortRef = useRef(null);

  // 🔹 Inicializar desde URL
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const [filters, setFilters] = useState(() => {
    const urlFilters = searchParams.get("filters");
    return urlFilters ? JSON.parse(urlFilters) : initialFilters;
  });

  const [data, setData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);

  // 🔎 debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), debounceTime);
    return () => clearTimeout(t);
  }, [search, debounceTime]);

  // 🔄 reset page
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters]);

  // 🔗 Sync URL
  useEffect(() => {
    const params = {};

    if (debouncedSearch) params.search = debouncedSearch;
    if (page > 1) params.page = page;
    if (Object.keys(filters).length > 0) {
      params.filters = JSON.stringify(filters);
    }

    setSearchParams(params);
  }, [debouncedSearch, filters, page, setSearchParams]);

  // 🌐 fetch con cancelación
  useEffect(() => {

    // cancelar request anterior
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const fetchData = async () => {
      setLoading(true);

      try {
        const formattedFilters = Object.fromEntries(
          Object.entries(filters).map(([k, v]) => [k, v.join(",")])
        );

        const res = await fetchFunction({
          search: debouncedSearch,
          filters: formattedFilters,
          page,
          limit,
          signal: controller.signal // 👈 clave
        });

        setData(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotalResults(res.total || 0);

      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();

  }, [debouncedSearch, filters, page, fetchFunction, limit]);

  return {
    search,
    setSearch,
    filters,
    setFilters,
    page,
    setPage,
    data,
    totalPages,
    totalResults,
    loading
  };
}