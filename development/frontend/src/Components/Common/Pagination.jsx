import { useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "../../styles/ComponentStyle/Common/Pagination.css"

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

  const handlePage = useCallback((page) => {
    if (page === "..." || page === currentPage) return;

    onPageChange(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }, [currentPage, onPageChange]);

  return (
    <nav className="pagination" aria-label="Paginación">

      <div className="pagination-main">

        {/* Anterior */}
        <button
          className="page-btn"
          onClick={() => handlePage(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Números */}
        <ul className="page-numbers">

          {pages.map((page, index) => (
            <li key={`${page}-${index}`}>

              {page === "..." ? (
                <span
                  className="dots"
                  aria-hidden="true"
                >
                  …
                </span>
              ) : (
                <button
                  className={`page-number ${page === currentPage ? "active" : ""}`}
                  onClick={() => handlePage(page)}
                  aria-current={page === currentPage ? "page" : undefined}
                  aria-label={
                    page === currentPage
                      ? `Página actual, ${page}`
                      : `Ir a la página ${page}`
                  }
                >
                  {page}
                </button>
              )}

            </li>
          ))}

        </ul>

        {/* Siguiente */}
        <button
          className="page-btn"
          onClick={() => handlePage(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Página siguiente"
        >
          <ChevronRight size={16} />
        </button>

      </div>

      {/* Selector */}
      <div className="page-select">

        <label htmlFor="goto-page" className="visually-hidden">
          Ir a página
        </label>

        <select
          id="goto-page"
          value={currentPage}
          onChange={(e) => handlePage(Number(e.target.value))}
        >
          {Array.from({ length: totalPages }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Página {i + 1}
            </option>
          ))}
        </select>

      </div>

    </nav>
  );
}

export default Pagination;