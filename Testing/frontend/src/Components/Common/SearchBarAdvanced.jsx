import { useState, useEffect, useRef } from "react";
import "../../Styles/ComponentStyle/Common/SearchBarAdvanced.css";

function SearchBarAdvanced({ 
  placeholder = "Buscar...", 
  onSearch, 
  onSortChange,
  debounceTime = 300, 
  filters = [],
  sortOptions = []
}) {

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [sortBy, setSortBy] = useState("");
  const [order, setOrder] = useState("asc");
  const [open, setOpen] = useState(false);

  const containerRef = useRef(null);

  // 🔍 Debounce
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), debounceTime);
    return () => clearTimeout(handler);
  }, [query, debounceTime]);

  // 🔍 Search
  useEffect(() => {
    if (onSearch) onSearch(debouncedQuery, selectedFilters);
  }, [debouncedQuery, selectedFilters, onSearch]);

  // 🔄 Sort
  useEffect(() => {
    if (onSortChange) {
      onSortChange({ sortBy, order });
    }
  }, [sortBy, order, onSortChange]);

  // ❌ cerrar al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFilterChange = (filterKey, option) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterKey]: option
    }));
  };

  // 🔥 TEXTO BOTÓN
  const getFilterLabel = () => {
    if (!sortBy) return "Default";

    const selected = sortOptions.find(opt => opt.value === sortBy);
    if (!selected) return "Default";

    const arrow = order === "asc" ? "↑" : "↓";

    return `${selected.label} ${arrow}`;
  };

  // 🔥 LABEL DINÁMICO
  const getTitle = () => {
    return sortBy ? "Ordenado por:" : "Ordenar por:";
  };

  return (
    <div className="search-bar-advanced">

      <div className="search-row">
        
        <input 
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
        />

        <button className="search-btn">
          Buscar
        </button>

        {/* FILTROS */}
        <div className="filter-container" ref={containerRef}>
          
          <span className="filter-title">
            {getTitle()}
          </span>

          <button 
            className={`filter-toggle-btn ${open ? "active" : ""}`}
            onClick={() => setOpen(!open)}
          >
            <span className="filter-icon">⚙</span>
            <span className="filter-text">{getFilterLabel()}</span>
          </button>

          <div className={`search-accordion ${open ? "open" : ""}`}>
            
            {/* ORDEN */}
            {sortOptions.length > 0 && (
              <>
                <div className="filter-inline">
                  <span className="filter-label">Ordenar por</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                  >
                    <option value="">Default</option>
                    {sortOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-inline">
                  <span className="filter-label">Orden</span>
                  <select
                    value={order}
                    onChange={e => setOrder(e.target.value)}
                  >
                    <option value="asc">Ascendente</option>
                    <option value="desc">Descendente</option>
                  </select>
                </div>
              </>
            )}

            {/* FILTROS */}
            {filters.map(f => (
              <div key={f.label} className="filter-inline">
                <span className="filter-label">{f.label}</span>
                <select
                  value={selectedFilters[f.label] || "Default"}
                  onChange={e => handleFilterChange(f.label, e.target.value)}
                >
                  <option value="Default">Default</option>
                  {f.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}

          </div>
        </div>

      </div>
    </div>
  );
}

export default SearchBarAdvanced;