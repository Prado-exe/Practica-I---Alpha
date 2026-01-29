import { Routes, Route } from "react-router-dom";
import Home from "./paginas/home";
import Login from "./paginas/login";
import Register from "./paginas/register";
import Navbar from "./componentes/navbar";
import Footer from "./componentes/footer";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register/>}/>
      </Routes>

      <Footer/>
      
    </>
  );
}

export default App;
