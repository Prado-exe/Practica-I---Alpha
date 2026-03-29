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
<<<<<<< HEAD

=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
    const updatedValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    onChange(filterKey, updatedValues);
  };

  return (
    <aside className="filters-panel">
<<<<<<< HEAD

      <h3 className="filters-title">Filtros</h3>

      {filters.map((filter) => (
        <details
          key={filter.key}
          className="filter-group"
          open={filter.defaultOpen}
        >
          <summary>{filter.title}</summary>

          <div className="filter-content">
            {filter.options.map((opt) => (
              <label key={opt}>
                <input
                  type="checkbox"
                  checked={
                    selectedFilters[filter.key]?.includes(opt) || false
                  }
                  onChange={() =>
                    handleToggle(filter.key, opt)
                  }
                />
                {opt}
              </label>
            ))}
          </div>
        </details>
      ))}

      <div className="filters-actions">
        <button className="clear-filters-btn" onClick={onClear}>
          Limpiar filtros
=======
      {filters.map((filter) => {
        const selections = selectedFilters[filter.key] || [];
        const hasSelection = selections.length > 0;

        return (
          <details
            key={filter.key}
            className="filter-group"
            open={filter.defaultOpen}
          >
            <summary className="filter-summary">
              <span className="summary-label">{filter.title}</span>
              <span className={`summary-display-value ${!hasSelection ? "is-empty" : ""}`}>
                {hasSelection ? selections.join(", ") : "Cualquiera"}
              </span>
            </summary>

            <div className="filter-content">
              {filter.options.map((opt) => (
                <label key={opt} className="filter-option-item">
                  <input
                    type="checkbox"
                    className="filter-checkbox"
                    checked={selections.includes(opt)}
                    onChange={() => handleToggle(filter.key, opt)}
                  />
                  <span className="option-text">{opt}</span>
                </label>
              ))}
            </div>
          </details>
        );
      })}

      <div className="filters-actions">
        <button className="clear-filters-btn" onClick={onClear}>
          Limpiar Todos Los Filtros
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
        </button>
      </div>
    </aside>
  );
}

export default AccordionFilter;