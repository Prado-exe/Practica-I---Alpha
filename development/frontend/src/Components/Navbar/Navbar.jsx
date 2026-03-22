import { FaUser, FaBars, FaTimes } from "react-icons/fa";
import { FaPenToSquare } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";

import AccessibilityTools from "../AccessibilityTools";
import DropdownMenu from "./DropdownMenu";
import UserDropdown from "../Navbar/UserDropdown";

import { useAuth } from "../../Context/AuthContext";
import logo from "../../assets/Ico_obs_datos2.png";

import "../../styles/ComponentStyle/Navbar/Navbar.css"

const navLinks = [
  { label: "Inicio", path: "/" },
  { label: "Datos", path: "/conjuntodatos" },
  { label: "Instituciones", path: "/instituciones" },
  { label: "Indicadores", path: "/indicadores" },
  { label: "Publicaciones", path: "/publicaciones" },
  { label: "Noticias", path: "/noticias" }, 
  { label: "Contacto", path: "/formulario" },
];

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

  // seccion para estar en modo debug, 
  const DEBUG_AUTH = import.meta.env.VITE_DEBUG_AUTH == "true";
  const effectiveUser = DEBUG_AUTH
    ? { name: "Admin", role: "admin" }
    : user;

  /* SCROLL OPTIMIZADO */
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const current = window.scrollY;

          setScrolled(current > 15);
          setHidden(current > lastScrollY && current > 100);

          lastScrollY = current;
          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
     <header
        className={`navbar 
          ${scrolled ? "navbar-scrolled" : "navbar-top-transparent"} 
          ${hidden ? "navbar-hidden" : ""}
          `}
      >
        {/* TOP */}
        <div className="navbar-top">
          <button
            className="hamburger-btn"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="main-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>

          <div className="navbar-logo">
            <Link to="/" aria-label="Ir al inicio">
              <img src={logo} alt="Observatorio de Datos" />
            </Link>
          </div>

          <div className="navbar-tools">
            <AccessibilityTools />

            <div className="navbar-auth">
              {!effectiveUser ? (
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
                <UserDropdown user={effectiveUser} logout={logout} />
              )}
            </div>
          </div>
        </div>

        {/* NAV */}
        <nav
          id="main-menu"
          className={`navbar-bottom ${menuOpen ? "open" : ""}`}
          aria-label="Navegación principal"
        >
          <ul className="nav-links">
            {navLinks.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) =>
                    `nav-btn ${isActive ? "active" : ""}`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <DropdownMenu links={aboutLinks} />
        </nav>
      </header>
    </>
  );
}

export default Navbar;