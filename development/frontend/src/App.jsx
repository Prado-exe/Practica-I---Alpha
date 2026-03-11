
/*
  App.jsx se encarga de la gestion de las paginas presentes y 
  el manejo de la accesibilidad presente en la pagina mediante 
  "AccesibilityContext"
*/
import { Routes, Route } from "react-router-dom";
import { AccessibilityProvider } from "./Components/Subcomponents/AccessibilityContext";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";

import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Formulario from "./Pages/Formulario";
import ConjuntoDatos from "./Pages/ConjuntoDatos";
import Publicaciones from "./Pages/publicaciones";
import Instituciones from "./Pages/Instituciones";
import Noticias from "./Pages/Noticias";
import Verificacion_de_seguridad from "./pages/Verificacion_de_seguridad";
import Recuperar_Contraseña from "./Pages/Recuperar_contraseña";
import ResetPassword from "./Pages/ResetPassword";

function App() {
  return (
    <AccessibilityProvider>
      
      <Navbar /> 
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/formulario" element={<Formulario />} />
          <Route path="/conjuntodatos" element={<ConjuntoDatos />} />
          <Route path="/publicaciones" element={<Publicaciones />} />
          <Route path="/instituciones" element={<Instituciones />} />
          <Route path="/noticias" element={<Noticias />} />
          <Route path="/verificacion" element={<Verificacion_de_seguridad/>}/>
          <Route path="/recuperar_contraseña" element={<Recuperar_Contraseña/>}/>
          <Route path="/reset-password" element={<ResetPassword />} />
          
        </Routes>
      </main>
      <Footer />
    </AccessibilityProvider>
  );
}

export default App;