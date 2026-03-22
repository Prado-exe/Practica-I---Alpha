import { FaUser, FaBars, FaTimes } from "react-icons/fa";
import { FaPenToSquare } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import AccessibilityTools from "../AccessibilityTools";
import DropdownMenu from "./DropdownMenu";

import { clearAllAuthState, getAuthToken } from "../../utils/auth";

import "../../styles/Component_styles/Navbar.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
  const [hidden, setHidden] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());
  const navigate = useNavigate();

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 15);

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHidden(true);
      } else {
        setHidden(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const syncAuth = () => {
      setIsAuthenticated(!!getAuthToken());
    };

    
    window.addEventListener("auth-changed", syncAuth);

    return () => {
      
      window.removeEventListener("auth-changed", syncAuth);
    };
  }, []);

  const handleLogout = async () => {
  try {
    const token = getAuthToken();

    if (token) {
      await fetch(`${API_URL}/api/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
    }
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  } finally {
    clearAllAuthState();
    window.dispatchEvent(new Event("auth-changed"));
    setIsAuthenticated(false);
    navigate("/");
  }
};

  return (
    <header
      className={`navbar 
        ${scrolled ? "navbar-scrolled" : ""} 
        ${hidden ? "navbar-hidden" : ""}`}
      role="banner"
    >
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
            {!isAuthenticated ? (
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
              <button type="button" className="btn" onClick={handleLogout}>
                <FaUser />
                <span>Cerrar sesión</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <nav
        className={`navbar-bottom ${menuOpen ? "open" : ""}`}
        aria-label="Navegación principal"
      >
        <ul className="nav-links">
          {navLinks.map((link) => (
            <li key={link.path}>
              <Link to={link.path} className="nav-btn">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <DropdownMenu links={aboutLinks} />
      </nav>
    </header>
  );
}

export default Navbar;