import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react"; 

//layouts and protected routes
import AdminLayout from "../Layouts/AdminLayout";
import MainLayout from "../Layouts/MainLayout";
import AuthLayout from "../Layouts/AuthLayout";
import ProtectedRoute from "../Pages/Admin/ProtectedRoute";

import SessionExpiryManager from "../Components/SessionExpiryManager";

//public routes
const Home = lazy(() => import("../Pages/Public/Home"));
const Formulario = lazy(() => import("../Pages/Public/Formulario"));
const Datos = lazy(() => import("../Pages/Public/Datos"));
const DatasetDetalle = lazy(() => import("../Pages/Public/DatasetDetalle"));

const Publicaciones = lazy(() => import("../Pages/Public/Publicaciones"));
const Instituciones = lazy(() => import("../Pages/Public/Instituciones"));
const InstitucionDetalle = lazy(() => import("../Pages/Public/InstitucionDetalle.jsx"));
const Noticias = lazy(() => import("../Pages/Public/Noticias"));
const Nosotros = lazy(() => import("../Pages/Public/Nosotros"));
const IndicadoresDefault = lazy(() => import("../Pages/Public/IndicadoresDefault"));
const IndicadoresAnalisis = lazy(() => import("../Pages/Public/Indicadores")); // Tu componente anterior
const PreguntasFrecuentes = lazy(() => import("../Pages/Public/PreguntasFrecuentes"));
const DatasetGraficos = lazy(() => import("../Pages/Public/DatasetGraficos"));

//Admin Routes
const Dashboard = lazy(() => import("../Pages/Admin/Dashboard"));
const PublicacionesAdmin = lazy(() => import("../Pages/Admin/PublicacionesAdmin"));
const Configuracion = lazy(() => import("../Pages/Admin/Configuracion"));
const GestionDatasets = lazy(() => import("../Pages/Admin/GestionDatasets"));
const GestionUsuarios = lazy(() => import("../Pages/Admin/GestionUsuarios"));
const GestionInstituciones = lazy(() => import("../Pages/Admin/GestionInstituciones"));
const GestionRoles = lazy(() => import("../Pages/Admin/GestionRoles"));
const CrearDatasetUsuario = lazy(() => import("../Pages/Admin/crear_datsets_usuarios"));
const MantenedorTags = lazy(() => import("../Pages/Admin/MantenedorTags"));

// login, register, auth routes
const Login = lazy(() => import("../Pages/Login"));
const Register = lazy(() => import("../Pages/Register"));
const VerificacionSeguridad = lazy(() => import("../Pages/Verificacionseguridad"));
const RecuperarContrasena = lazy(() => import("../Pages/RecuperarContrasena"));
const ResetPassword = lazy(() => import("../Pages/ResetPassword"));


const NoticiasAdmin = lazy(() => import("../Pages/Admin/NoticiasAdmin"));
const GestionCarrusel = lazy(() => import("../Pages/Admin/GestionCarrusel"));


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
          // El guardia principal: Solo usuarios logueados pueden entrar al Layout
          <ProtectedRoute>
            <AdminLayout /> 
          </ProtectedRoute>
        }
      >
        {/* El Dashboard queda abierto a cualquier usuario logueado en el panel */}
        <Route index element={<Dashboard />} />

        <Route path="proponer-dataset" element={
          <ProtectedRoute requiredPermission="data_management.write">
            <CrearDatasetUsuario />
          </ProtectedRoute>
        } />
        
        {/* 👇 Seguridad granular en cada subpanel */}
        <Route path="usuarios" element={
          <ProtectedRoute requiredPermission="user_management.read">
            <GestionUsuarios />
          </ProtectedRoute>
        } />
        
        <Route path="publicaciones" element={
          <ProtectedRoute requiredPermission="catalog.write">
            <PublicacionesAdmin />
          </ProtectedRoute>
        } />
        
        <Route path="configuracion" element={
          <ProtectedRoute requiredPermission="admin_general.manage">
            <Configuracion />
          </ProtectedRoute>
        } />
        
        <Route path="datasets" element={
          <ProtectedRoute requiredPermission="data_management.read">
            <GestionDatasets />
          </ProtectedRoute>
        } />
        
        <Route path="instituciones" element={
          <ProtectedRoute requiredPermission="admin_general.manage">
            <GestionInstituciones />
          </ProtectedRoute>
        } />
        
        <Route path="roles" element={
          <ProtectedRoute requiredPermission="roles_permissions.read">
            <GestionRoles />
          </ProtectedRoute>
        } />

        <Route
          path="/administracion/noticias"
          element={
            <ProtectedRoute requiredPermission="catalog.write">
              <NoticiasAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/administracion/carrusel"
          element={
            <ProtectedRoute requiredPermission="catalog.write">
              <GestionCarrusel />
            </ProtectedRoute>
          }
        />

        <Route path="etiquetas" element={
          <ProtectedRoute requiredPermission="admin_general.manage">
            <MantenedorTags />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Error404 />} />
      </Route>

      {/* Rutas con layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/noticias" element={<Noticias />} />
        <Route path="/formulario" element={<Formulario />} />
        <Route path="/conjuntodatos" element={<Datos />} />
        <Route path="/conjuntodatos/:id" element={<DatasetDetalle />} />
        <Route path="/conjuntodatos/:id/graficos" element={<DatasetGraficos />} />
        <Route path="/publicaciones" element={<Publicaciones />} />
        <Route path="/instituciones" element={<Instituciones />} />
        <Route path="/instituciones/:id" element={<InstitucionDetalle />} />
        <Route path="/nosotros/:section" element={<Nosotros />} />
        <Route path="/indicadores" element={<IndicadoresDefault />} />
        <Route path="/indicadores/analisis" element={<IndicadoresAnalisis />} />
        <Route path="/preguntas-frecuentes" element={<PreguntasFrecuentes />} />
        <Route path="*" element={<Error404 />} />
      </Route>
      
      {/* Rutas Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verificacion" element={<VerificacionSeguridad />} />
        <Route path="/recuperar-password" element={<RecuperarContrasena />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Error404 />} />
      </Route>

      {/* Rutas sin layout */}
        <Route path="*" element={<Error404 />} />

    </Routes>
    </Suspense>
    </>
  );
}

export default AppRoutes;