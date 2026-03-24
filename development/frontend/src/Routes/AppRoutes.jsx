import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react"; 

//layouts and protected routes
import AdminLayout from "../Layouts/AdminLayout";
import MainLayout from "../Layouts/MainLayout";
import ProtectedRoute from "../Pages/Admin/ProtectedRoute";

import SessionExpiryManager from "../Components/SessionExpiryManager";

//public routes
const Home = lazy(() => import("../Pages/Public/Home"));
const Formulario = lazy(() => import("../Pages/Public/Formulario"));
const Datos = lazy(() => import("../Pages/Public/Datos"));
const Publicaciones = lazy(() => import("../Pages/Public/Publicaciones"));
const Instituciones = lazy(() => import("../Pages/Public/Instituciones"));
const InstitucionDetalle = lazy(() => import("../Pages/Public/InstitucionDetalle.jsx"));
const Noticias = lazy(() => import("../Pages/Public/Noticias"));
const Nosotros = lazy(() => import("../Pages/Public/Nosotros"));

//Admin Routes
const Dashboard = lazy(() => import("../Pages/Admin/Dashboard"));
const PublicacionesAdmin = lazy(() => import("../Pages/Admin/PublicacionesAdmin"));
const Configuracion = lazy(() => import("../Pages/Admin/Configuracion"));
const GestionDatasets = lazy(() => import("../Pages/Admin/GestionDatasets"));
const GestionUsuarios = lazy(() => import("../Pages/Admin/GestionUsuarios"));
const GestionInstituciones = lazy(() => import("../Pages/Admin/GestionInstituciones"));
const GestionRoles = lazy(() => import("../Pages/Admin/GestionRoles"));

// login, register, auth routes
const Login = lazy(() => import("../Pages/Login"));
const Register = lazy(() => import("../Pages/Register"));
const VerificacionSeguridad = lazy(() => import("../Pages/Verificacionseguridad"));
const RecuperarContrasena = lazy(() => import("../Pages/RecuperarContrasena"));
const ResetPassword = lazy(() => import("../Pages/ResetPassword"));

// not found route
const Error404 = lazy(() => import("../Pages/Public/Error404"));

//others
import Loader from "../Components/Common/Loader";

function AppRoutes() {
  return (
    <>
    <SessionExpiryManager />
    <Suspense fallback={<Loader />}>
    <Routes>
      {/*Admin routes, Admin Layout */}
      <Route
        path="/administracion"
        element={
          <ProtectedRoute>
            <AdminLayout /> 
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="usuarios" element={<GestionUsuarios />} />
        <Route path="publicaciones" element={<PublicacionesAdmin />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="datasets" element={<GestionDatasets />} />
        <Route path="instituciones" element={<GestionInstituciones />} />
        <Route path="roles" element={<GestionRoles />} />
        <Route path="*" element={<Error404 />} />
      </Route>

      {/* Rutas con layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/noticias" element={<Noticias />} />
        <Route path="/formulario" element={<Formulario />} />
        <Route path="/conjuntodatos" element={<Datos />} />
        <Route path="/publicaciones" element={<Publicaciones />} />
        <Route path="/instituciones" element={<Instituciones />} />
        <Route path="/instituciones/:id" element={<InstitucionDetalle />} />
        <Route path="/nosotros/:section" element={<Nosotros />} />
        <Route path="*" element={<Error404 />} />
      </Route>

      {/* Rutas sin layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verificacion" element={<VerificacionSeguridad />} />
        <Route path="/recuperar-password" element={<RecuperarContrasena />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Error404 />} />

    </Routes>
    </Suspense>
    </>
  );
}

export default AppRoutes;
