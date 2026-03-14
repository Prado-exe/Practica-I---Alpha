import { useMemo } from "react";
import "../../styles/component_styles/Pagination.css";

function Pagination({ currentPage, totalPages, onPageChange }) {

  const pages = useMemo(() => {

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages
    ];

  }, [currentPage, totalPages]);

  const handlePage = (page) => {
    if (page === "...") return;
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className="pagination" aria-label="Paginación">

      {/* BLOQUE IZQUIERDO */}
      <div className="pagination-main">

        <button
          className="page-btn"
          onClick={() => handlePage(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Ir a la página anterior"
        >
          ← Anterior
        </button>

        <div className="page-numbers">

          {pages.map((page, index) =>
            page === "..." ? (
              <span key={index} className="dots">…</span>
            ) : (
              <button
                key={page}
                className={`page-number ${page === currentPage ? "active" : ""}`}
                onClick={() => handlePage(page)}
                aria-current={page === currentPage ? "page" : undefined}
                aria-label={`Ir a la página ${page}`}
              >
                {page}
              </button>
            )
          )}

        </div>

        <button
          className="page-btn"
          onClick={() => handlePage(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Ir a la página siguiente"
        >
          Siguiente →
        </button>

      </div>

      {/* BLOQUE DERECHO */}
      <div className="page-select">

        <label htmlFor="goto-page">Mostrar</label>

        <select
          id="goto-page"
          value={currentPage}
          onChange={(e) => handlePage(Number(e.target.value))}
        >
          {Array.from({ length: totalPages }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>

      </div>

    </nav>
  );
}

export default Pagination;