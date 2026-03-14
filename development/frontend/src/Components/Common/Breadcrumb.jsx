import { Link, useLocation } from "react-router-dom";
import "../../styles/component_styles/Breadcrumb.css";

function Breadcrumb() {

  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(Boolean);

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">

        <li className="breadcrumb-item">
          <Link to="/" className="breadcrumb-link">
            <span className="home-icon">🏠</span> Inicio
          </Link>
        </li>

        {pathnames.map((value, index) => {

          const to = "/" + pathnames.slice(0, index + 1).join("/");
          const isLast = index === pathnames.length - 1;

          const label =
            value.charAt(0).toUpperCase() + value.slice(1);

          return (
            <li key={to} className="breadcrumb-item">

              <span className="breadcrumb-separator">›</span>

              {isLast ? (
                <span
                  className="breadcrumb-current"
                  aria-current="page"
                >
                  {label}
                </span>
              ) : (
                <Link to={to} className="breadcrumb-link">
                  {label}
                </Link>
              )}

            </li>
          );
        })}

      </ol>
    </nav>
  );
}

export default Breadcrumb;