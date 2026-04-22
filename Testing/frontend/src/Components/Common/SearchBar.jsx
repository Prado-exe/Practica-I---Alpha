import { useState, useEffect } from "react";
import "../../Styles/ComponentStyle/Home/SearchBar.css";

function SearchBar({ placeholder = "Buscar...", onSearch, debounceTime = 300 }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce: actualiza el valor filtrado tras cierto tiempo
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceTime);

    return () => clearTimeout(handler);
  }, [query, debounceTime]);

  // Llamada al callback cuando cambia el valor debounced
  useEffect(() => {
    if (onSearch) onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleChange = (e) => setQuery(e.target.value);
  const handleClear = () => setQuery("");

  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label="Buscar"
      />
      {query && (
        <button className="clear-btn" onClick={handleClear} aria-label="Limpiar búsqueda">
          ✖
        </button>
      )}
    </div>
  );
}

export default SearchBar;