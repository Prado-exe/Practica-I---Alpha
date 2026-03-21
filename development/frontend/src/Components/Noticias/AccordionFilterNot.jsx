import React from "react";
import "../../Styles/ComponentStyle/Noticias/AccordionFilterNot.css"

function AccordionFilterNot({
  selectedCategories,
  toggleCategory,
  selectedYears,
  toggleYear,
  clearFilters
}) {
  return (
    <aside className="filters-panel">

      <h3 className="filters-title">Filtros</h3>

      <details className="filter-group" open>
        <summary>Categorías</summary>
        <div className="filter-content">
          {["Tecnología", "Sociedad", "Medio Ambiente"].map((cat) => (
            <label key={cat}>
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
              />
              {cat}
            </label>
          ))}
        </div>
      </details>

      <details className="filter-group">
        <summary>Año</summary>
        <div className="filter-content">
          {["2025", "2024", "2023", "2022"].map((year) => (
            <label key={year}>
              <input
                type="checkbox"
                checked={selectedYears.includes(year)}
                onChange={() => toggleYear(year)}
              />
              {year}
            </label>
          ))}
        </div>
      </details>

      <div className="filters-actions">
        <button className="clear-filters-btn" onClick={clearFilters}>
          Limpiar filtros
        </button>
      </div>
    </aside>
  );
}

export default AccordionFilterNot;