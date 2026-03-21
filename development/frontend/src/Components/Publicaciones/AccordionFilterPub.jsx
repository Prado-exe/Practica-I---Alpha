// src/Components/Publicaciones/AccordionFilterPub.jsx
import { useState, useMemo } from "react";
import "../../Styles/ComponentStyle/Publicaciones/AccordionFilterPub.css";

function AccordionFilterPub({ title, options = [], selected = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filteredOptions = useMemo(() => 
    options.filter(opt => opt.toLowerCase().includes(search.toLowerCase())), 
    [options, search]
  );

  const visibleOptions = showAll ? filteredOptions : filteredOptions.slice(0, 5);

  return (
    <div className="accordion">
      <button
        className="accordion-header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <div className="accordion-meta">
          {selected.length > 0 && <span className="accordion-count">{selected.length}</span>}
          <span>{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="accordion-content">
          <input
            type="text"
            placeholder="Buscar..."
            className="accordion-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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

export default AccordionFilterPub;