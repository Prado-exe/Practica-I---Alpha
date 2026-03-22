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

    const updatedValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    onChange(filterKey, updatedValues);
  };

  return (
    <aside className="filters-panel">

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
        </button>
      </div>
    </aside>
  );
}

export default AccordionFilter;