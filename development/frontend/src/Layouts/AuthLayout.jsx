import { Outlet } from "react-router-dom";
import "../Styles/Layout/AuthLayout.css";
import fondo from "../assets/FondoGeneral.png"; 

function AuthLayout() {
  return (
    <div 
      className="auth-layout" 
      style={{ backgroundImage: `url(${fondo})` }}
    >
      {/* Eliminamos el div .auth-form-container */}
      {/* El Outlet inyecta el Login/Register directamente aquí */}
      <Outlet />
    </div>
  );
}

export default AuthLayout;