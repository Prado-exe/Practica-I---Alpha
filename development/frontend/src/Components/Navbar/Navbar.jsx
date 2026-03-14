import { FaUser, FaBars, FaTimes } from "react-icons/fa";
import { FaPenToSquare } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

import AccessibilityTools from "../AccessibilityTools";
import DropdownMenu from "./DropdownMenu";

import "../../styles/Component_styles/Navbar.css";
import { useAuth } from "../../Context/AuthContext";

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
  { label: "Quiénes somos", path: "/nosotros/quienes-somos" },
  { label: "Objetivos estratégicos", path: "/nosotros/objetivos" },
  { label: "Misión y visión", path: "/nosotros/mision-vision" },
  { label: "Principios", path: "/nosotros/principios" },
  { label: "Metodología", path: "/nosotros/metodologia" },
  { label: "Equipo", path: "/nosotros/equipo" },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { user, logout } = useAuth();
  
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 15);
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // bajando
        setHidden(true);
      } else {
        // subiendo
        setHidden(false);
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`navbar 
        ${scrolled ? "navbar-scrolled" : ""} 
        ${hidden ? "navbar-hidden" : ""}`}
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
          {!user ? (
            <>
              <Link to="/login" className="btn">
                <FaUser />
                <span>Iniciar sesión</span>
              </Link>

              <Link to="/register" className="btn">
                <FaPenToSquare />
                <span>Registrarse</span>
              </Link>
            </>
          ) : (
            <>
              <span className="navbar-user">
                <FaUser />
                <span>{user.name}</span>
              </span>

              <button className="btn logout-btn" onClick={logout}>
                Cerrar sesión
              </button>
            </>
          )}

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
              <Link to={link.path} className="nav-btn">
                {link.label}
              </Link>
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