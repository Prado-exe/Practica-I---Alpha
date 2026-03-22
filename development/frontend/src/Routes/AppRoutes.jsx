import { Routes, Route } from "react-router-dom";
import MainLayout from "../Layouts/MainLayout";

import Home from "../Pages/Home";
import Login from "../Pages/Login";
import Register from "../Pages/Register";
import Formulario from "../Pages/Formulario";
import ConjuntoDatos from "../Pages/ConjuntoDatos";
import Publicaciones from "../Pages/Publicaciones";
import Instituciones from "../Pages/Instituciones";
import Noticias from "../Pages/Noticias";
import VerificacionSeguridad from "../Pages/Verificacionseguridad";
import RecuperarContrasena from "../Pages/RecuperarContrasena";
import ResetPassword from "../Pages/ResetPassword";
import SessionExpiryManager from "../Components/SessionExpiryManager";
//import NotFound from "../Pages/NotFound";
//{/* Ruta 404 */}
//<Route path="*" element={<NotFound />} />

function AppRoutes() {
  return (
    <>
    <SessionExpiryManager />
    <Routes>

      {/* Rutas con layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/noticias" element={<Noticias />} />
        <Route path="/formulario" element={<Formulario />} />
        <Route path="/conjuntodatos" element={<ConjuntoDatos />} />
        <Route path="/publicaciones" element={<Publicaciones />} />
        <Route path="/instituciones" element={<Instituciones />} />
        
        
      </Route>

      {/* Rutas sin layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verificacion" element={<VerificacionSeguridad />} />
        <Route path="/recuperar-password" element={<RecuperarContrasena />} />
        <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
    </>
  );
}

export default AppRoutes;
