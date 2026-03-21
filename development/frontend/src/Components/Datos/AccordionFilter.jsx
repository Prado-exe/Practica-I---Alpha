import { useState, useMemo } from "react";
import "../../Styles/ComponentStyle/Datos/AccordionFilter.css"

function AccordionFilter({
  title,
  options = [],
  selected = [],
  onChange
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  // 🔎 filtrar opciones
  const filteredOptions = useMemo(() => {
    return options.filter(opt =>
      opt.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, options]);

  const visibleOptions = showAll
    ? filteredOptions
    : filteredOptions.slice(0, 5);

  return (
    <div className="accordion">

      {/* HEADER */}
      <button
        className="accordion-header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{title}</span>

        <div className="accordion-meta">
          {selected.length > 0 && (
            <span className="accordion-count">
              {selected.length}
            </span>
          )}
          <span>{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* CONTENT */}
      {open && (
        <div className="accordion-content">

          {/* 🔎 buscador interno */}
          <input
            type="text"
            placeholder="Buscar..."
            className="accordion-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* opciones */}
          <div className="accordion-options">
            {visibleOptions.map(opt => (
              <label key={opt} className="accordion-option">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => onChange(opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>

          {/* ver más */}
          {filteredOptions.length > 5 && (
            <button
              className="accordion-show-more"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Ver menos" : "Ver más"}
            </button>
          )}

        </div>
      )}
    </div>
  );
}

export default AccordionFilter;