import { FaUser } from "react-icons/fa";
import { FaPenToSquare } from "react-icons/fa6";
import { FaBars, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AccessibilityContext } from "./Subcomponents/AccessibilityContext";

import "../styles/Component_styles/Navbar.css";

function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { increaseFont, decreaseFont, toggleContrast, highContrast, fontScale } =
    useContext(AccessibilityContext);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Skip link */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>

      <header className={`navbar ${scrolled ? "navbar-scrolled" : ""}`} role="banner">
        {/* PARTE SUPERIOR */}
        <div className="navbar-top">
          {/* Botón hamburguesa móvil */}
          <button
            className="hamburger-btn"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>

          {/* Logo */}
          <div className="navbar-logo">
            <Link to="/" aria-label="Ir al inicio">
              <picture>
                <source media="(max-width: 768px)" srcSet="/src/assets/content.png" />
                <img src="/src/assets/Ico_obs_datos2.png" alt="Observatorio de Datos" />
              </picture>
            </Link>
          </div>

          {/* Iconos login/register móviles */}
          <div className="navbar-auth-mobile">
            <Link to="/login">
               <FaUser />
            </Link>
            <Link to="/register" className="btn-icon-only" aria-label="Registrarse">
              <FaPenToSquare />
            </Link>
          </div>

          {/* Herramientas y auth desktop */}
          <div className={`navbar-tools ${menuOpen ? "open" : ""}`}>
            <div className="navbar-accessibility">
              <button
                onClick={increaseFont}
                aria-label="Aumentar tamaño de texto"
                disabled={fontScale >= 1.5}
              >
                A+
              </button>
              <button
                onClick={decreaseFont}
                aria-label="Disminuir tamaño de texto"
                disabled={fontScale <= 0.8}
              >
                A-
              </button>
              <button
                onClick={toggleContrast}
                aria-label="Activar o desactivar alto contraste"
                aria-pressed={highContrast}
              >
                ⬛
              </button>
            </div>

            <div className="navbar-auth">
              <Link to="/login" className="btn">
                <FaUser className="btn-icon" aria-hidden="true" />
                <span>Iniciar sesión</span>
              </Link>
              <Link to="/register" className="btn">
                <FaPenToSquare className="btn-icon" aria-hidden="true" />
                <span>Registrarse</span>
              </Link>
            </div>
          </div>
        </div>

        {/* PARTE INFERIOR */}
        <nav className={`navbar-bottom ${menuOpen ? "open" : ""}`} role="navigation" aria-label="Navegación principal">
          {["Inicio", "Datos", "Instituciones", "Indicadores", "Publicaciones", "Noticias", "Contacto"].map((item) => (
            <Link key={item} to={`/${item.toLowerCase()}`} className="nav-btn">
              {item}
            </Link>
          ))}

          {/* Dropdown accesible */}
          <div className="dropdown">
            <button
              className="dropdown-btn"
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              onKeyDown={(e) => e.key === "Escape" && setDropdownOpen(false)}
            >
              Sobre nosotros ▾
            </button>
            {dropdownOpen && (
              <div className="dropdown-menu">
                {[
                  { label: "Quiénes somos", path: "/quienes-somos" },
                  { label: "Objetivos estratégicos", path: "/objetivos" },
                  { label: "Misión y visión", path: "/mision-vision" },
                  { label: "Principios", path: "/principios" },
                  { label: "Metodología", path: "/metodologia" },
                ].map((link) => (
                  <Link key={link.path} to={link.path}>
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      </header>
    </>
  );
}

export default Navbar;