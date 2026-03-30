import React from "react";
import "../../Styles/ComponentStyle/Common/AccordionFilter.css";

function AccordionFilter({
  filters = [],
  selectedFilters = {},
  onChange,
  onClear
}) {
  
  const handleToggle = (filterKey, value) => {
    const currentValues = selectedFilters[filterKey] || [];
    // 🔹 Ahora comparamos IDs (values)
    const updatedValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    onChange(filterKey, updatedValues);
  };

  return (
    <aside className="filters-panel">
      {filters.map((filter) => {
        const selections = selectedFilters[filter.key] || [];
        const hasSelection = selections.length > 0;

        // 🔹 Para el resumen (summary), buscamos los nombres (labels) 
        // de los IDs que están seleccionados actualmente
        const selectedLabels = filter.options
          .filter(opt => selections.includes(opt.value))
          .map(opt => opt.label);

        return (
          <details
            key={filter.key}
            className="filter-group"
            open={filter.defaultOpen || hasSelection}
          >
            <summary className="filter-summary">
              <span className="summary-label">{filter.title}</span>
              <span className={`summary-display-value ${!hasSelection ? "is-empty" : ""}`}>
                {hasSelection ? selectedLabels.join(", ") : "Cualquiera"}
              </span>
            </summary>

            <div className="filter-content">
              {filter.options.map((opt) => (
                <label key={opt.value} className="filter-option-item">
                  <input
                    type="checkbox"
                    className="filter-checkbox"
                    // 🔹 El ID es lo que determina si está marcado
                    checked={selections.includes(opt.value)}
                    onChange={() => handleToggle(filter.key, opt.value)}
                  />
                  <span className="option-text">{opt.label}</span>
                </label>
              ))}
            </div>
          </details>
        );
      })}

      <div className="filters-actions">
        <button 
          className="clear-filters-btn" 
          onClick={onClear}
        >
          Limpiar Todos Los Filtros
        </button>
      </div>
    </aside>
  );
}

export default AccordionFilter;