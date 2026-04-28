import { Link, useLocation } from "react-router-dom";
import { useMemo } from "react";
import { Home } from "lucide-react"; // icono minimalista
import "../../styles/ComponentStyle/Common/breadcrumb.css"
function formatLabel(value) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function Breadcrumb({ paths }) {
  const location = useLocation();

  const breadcrumbs = useMemo(() => {
    const pathnames = location.pathname.split("/").filter(Boolean);
    // paths prop: ["Inicio", "Label1", "Label2", ...] — slice(1) to skip the Home entry
    const customLabels = paths && paths.length > 1 ? paths.slice(1) : null;

    return pathnames.map((value, index) => {
      const label =
        customLabels && customLabels[index] != null
          ? customLabels[index]
          : formatLabel(value);
      return {
        label,
        to: "/" + pathnames.slice(0, index + 1).join("/"),
        isLast: index === pathnames.length - 1,
      };
    });
  }, [location.pathname, paths]);

  return (
    <nav className="breadcrumb" aria-label="Ruta de navegación">
      <ol className="breadcrumb-list">

        {/* Inicio */}
        <li className="breadcrumb-item">
          <Link to="/" className="breadcrumb-link">
            <Home size={16} aria-hidden="true" />
            <span className="visually-hidden">Inicio</span>
          </Link>
        </li>

        {breadcrumbs.map((crumb) => (
          <li key={crumb.to} className="breadcrumb-item">

            {/* Separador accesible */}
            <span className="breadcrumb-separator" aria-hidden="true">
              /
            </span>

            {crumb.isLast ? (
              <span
                className="breadcrumb-current"
                aria-current="page"
              >
                {crumb.label}
              </span>
            ) : (
              <Link to={crumb.to} className="breadcrumb-link">
                {crumb.label}
              </Link>
            )}

          </li>
        ))}

      </ol>
    </nav>
  );
}

export default Breadcrumb;