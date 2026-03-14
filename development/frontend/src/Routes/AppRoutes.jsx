import { Routes, Route } from "react-router-dom";
import MainLayout from "../Layouts/MainLayout";


import Home from "../Pages/Home";
import Login from "../Pages/Login";
import Register from "../Pages/Register";
import Formulario from "../Pages/Formulario";
import Datos from "../Pages/Datos";
import Publicaciones from "../Pages/Publicaciones";
import Instituciones from "../Pages/Instituciones";
import Noticias from "../Pages/Noticias";
import VerificacionSeguridad from "../Pages/Verificacionseguridad";
import RecuperarContrasena from "../Pages/RecuperarContrasena";
import ResetPassword from "../Pages/ResetPassword";
import Nosotros from "../Pages/Nosotros";
//import NotFound from "../Pages/NotFound";
//{/* Ruta 404 */}
//<Route path="*" element={<NotFound />} />

function AppRoutes() {
  return (
    <Routes>
      {/* Rutas con layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/noticias" element={<Noticias />} />
        <Route path="/formulario" element={<Formulario />} />
        <Route path="/conjuntodatos" element={<Datos />} />
        <Route path="/publicaciones" element={<Publicaciones />} />
        <Route path="/instituciones" element={<Instituciones />} />
        <Route path="/noticias" element={<Noticias />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/nosotros/:section" element={<Nosotros />} />
      
      </Route>
      {/* Rutas sin layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verificacion" element={<VerificacionSeguridad />} />
        <Route path="/recuperar-password" element={<RecuperarContrasena />} />
        <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  );
}

export default AppRoutes;
