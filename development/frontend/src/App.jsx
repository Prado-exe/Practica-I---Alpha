
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

function App() {
  return (
    <AccessibilityProvider>
      
      <Navbar /> 
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
      <Footer />
    </AccessibilityProvider>
  );
}

export default App;