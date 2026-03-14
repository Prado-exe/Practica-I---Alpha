import { useState } from "react";
import "../../Styles/Component_styles/AccordionFilter.css";

function AccordionFilter({ title, options = [], isDateFilter = false }) {
  const [open, setOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");

  const toggleOpen = () => setOpen(!open);

  return (
    <div className="accordion">
      {/* Header del acordeón */}
      <div className="accordion-header" onClick={toggleOpen}>
        <span className="accordion-title">{title}</span>
        <span className="accordion-arrow">{open ? "▲" : "▼"}</span>
      </div>

      {/* Contenido desplegable */}
      {open && (
        <div className="accordion-content">
          {isDateFilter ? (
            <input
              type="date"
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
            />
          ) : (
            options.map((opt, idx) => (
              <label key={idx} className="accordion-option">
                <input
                  type="checkbox"
                  value={opt}
                  checked={selectedOption === opt}
                  onChange={() =>
                    setSelectedOption(selectedOption === opt ? "" : opt)
                  }
                />
                {opt}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AccordionFilter;