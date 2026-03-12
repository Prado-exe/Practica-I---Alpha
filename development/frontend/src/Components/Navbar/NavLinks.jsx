import { FaUser, FaBars, FaTimes } from "react-icons/fa";
import { FaPenToSquare } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

import AccessibilityTools from "../AccessibilityTools";
import DropdownMenu from "./DropdownMenu";

import "../../styles/Component_styles/Navbar.css";

/* LINKS PRINCIPALES */
const navLinks = [
  { label: "Inicio", path: "/" },
  { label: "Datos", path: "/conjuntodatos" },
  { label: "Instituciones", path: "/instituciones" },
  { label: "Indicadores", path: "/indicadores" },
  { label: "Publicaciones", path: "/publicaciones" },
  { label: "Noticias", path: "/noticias" },
  { label: "Contacto", path: "/formulario" },
];

/* LINKS DEL DROPDOWN */
const aboutLinks = [
  { label: "Quiénes somos", path: "/quienes-somos" },
  { label: "Objetivos estratégicos", path: "/objetivos" },
  { label: "Misión y visión", path: "/mision-vision" },
  { label: "Principios", path: "/principios" },
  { label: "Metodología", path: "/metodologia" },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}
      role="banner"
    >
      {/* TOP */}
      <div className="navbar-top">

        <button
          className="hamburger-btn"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className="navbar-logo">
          <Link to="/" aria-label="Ir al inicio">
            <img
              src="/src/assets/Ico_obs_datos2.png"
              alt="Observatorio de Datos"
            />
          </Link>
        </div>

        <div className="navbar-tools">

          <AccessibilityTools />

          <div className="navbar-auth">

            <Link to="/login" className="btn">
              <FaUser />
              <span>Iniciar sesión</span>
            </Link>

            <Link to="/register" className="btn">
              <FaPenToSquare />
              <span>Registrarse</span>
            </Link>

          </div>

        </div>

      </div>

      {/* BOTTOM */}
      <nav
        className={`navbar-bottom ${menuOpen ? "open" : ""}`}
        aria-label="Navegación principal"
      >

        {/* LINKS PRINCIPALES */}
        <ul className="nav-links">
          {navLinks.map((link) => (
            <li key={link.path}>
              <Link to={link.path}>{link.label}</Link>
            </li>
          ))}
        </ul>

        {/* DROPDOWN */}
        <DropdownMenu links={aboutLinks} />

      </nav>

    </header>
  );
}

export default Navbar;