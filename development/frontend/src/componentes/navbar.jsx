import { FaAdjust , FaUser} from "react-icons/fa";
import { FaPenToSquare } from "react-icons/fa6";
import { Link } from "react-router-dom";
import HerramientasAccesibilidad from "./subcomponentes/herramientasAccesibilidad";

import "../styles/componentes_styles/navbar.css";

function Navbar() {
  return (
    <header className="navbar"> 
      {/* mitad superior navbar */}      
      <div className="navbar-top">

        {/* logo */}
        <div className="navbar-logo">
          <Link to="/" aria-label="Ir al inicio">
            <img src="/src/assets/Ico_obs_datos2.png" alt="Logo" /> 
          </Link>
          
        </div>

        {/* botones accesibilidad */}
        <div className="navbar-right">
          <HerramientasAccesibilidad/>
          
        </div> 
        
        {/* Login / Register */}
        <div className="navbar-auth">
          <button className="btn login">
            <FaUser className="btn-icon" />
            <Link to="/login" className="nav-link">
              Iniciar sesión
            </Link>
          </button>

          <button className="btn register">
            <FaPenToSquare className="btn-icon" />
            <Link to="/register" className="nav-link">
              Registrarse
            </Link>
          </button>
        </div>

      </div>

      {/* Parte inferior */}
      <nav className="navbar-bottom">
        <Link to="/" className="nav-btn">Inicio</Link>
        <button>datos</button>
        <button>instituciones</button>
        <button>indicadores</button>
        <button>publicaciones</button>
        <button>noticias</button>
        <button>contacto</button>

        <div className="dropdown">
          <button className="dropdown-btn">
            sobre nosotros <span>▾</span>
          </button>
          <div className="dropdown-menu">
            <button>quienes somos</button>
            <button>objetivos estrategicos</button>
            <button>mision y vision</button>
            <button>principios</button>
            <button>metodologia</button>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;

