import { useState, useEffect } from "react";
import "../../Styles/Component_styles/SearchBarAdvanced.css";

function SearchBarAdvanced({ 
  placeholder = "Buscar...", 
  onSearch, 
  debounceTime = 300, 
  filters = [] 
}) {

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [selectedFilters, setSelectedFilters] = useState({});

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), debounceTime);
    return () => clearTimeout(handler);
  }, [query, debounceTime]);

  useEffect(() => {
    if(onSearch) onSearch(debouncedQuery, selectedFilters);
  }, [debouncedQuery, selectedFilters, onSearch]);

  const handleFilterChange = (filterKey, option) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterKey]: option
    }));
  };

  const handleSearchClick = () => {
    if(onSearch) onSearch(query, selectedFilters);
  };

  return (
    <div className="search-bar-advanced">
      {/* Input y botón a la izquierda */}
      <div className="search-left">
        <input 
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Buscar"
        />
        <button className="search-btn" onClick={handleSearchClick}>Buscar</button>
      </div>

      {/* Filtros a la derecha */}
      <div className="search-right">
        {filters.map(f => (
          <div key={f.label} className="filter-inline">
            <span className="filter-label">{f.label}:</span>
            <select
              value={selectedFilters[f.label] || "Default"}
              onChange={e => handleFilterChange(f.label, e.target.value)}
              className="filter-select"
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
  );
}

export default SearchBarAdvanced;