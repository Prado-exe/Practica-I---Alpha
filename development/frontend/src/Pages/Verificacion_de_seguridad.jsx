import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/pages_styles/Verificacion_de_seguridad.css";
import logo from "../assets/content.png";

function Verificacion_de_seguridad() {

  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  const [codigo,setCodigo] = useState("");
  const [error,setError] = useState("");

  const verificarCodigo = async (e) => {

    e.preventDefault();

    try{

      const response = await fetch("http://localhost:3000/api/verificar",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body: JSON.stringify({
          email,
          codigo
        })
      });

      const data = await response.json();

      if(data.valid){
        navigate("/home");
      }else{
        setError("El código ingresado es incorrecto");
      }

    }catch(err){
      console.error(err);
    }

  };

  return (

    <div className="login-bg">

      <form
        className="login-container"
        onSubmit={verificarCodigo}
      >

        <img src={logo} alt="Logo del sitio" className="login-logo"/>

        <h2 style={{textAlign:"center", marginBottom:"1rem"}}>
          Verificación de seguridad
        </h2>

        <p style={{fontSize:"0.9rem", marginBottom:"1rem", textAlign:"center"}}>
          Hemos enviado un código a <b>{email}</b>
        </p>

        <label htmlFor="codigo">Código de verificación</label>

        <input
          id="codigo"
          type="text"
          className="login-input"
          placeholder="Ingresa el código"
          value={codigo}
          onChange={(e)=>setCodigo(e.target.value)}
          required
        />

        {error && (
          <p style={{color:"red", fontSize:"0.85rem", marginBottom:"0.7rem"}}>
            {error}
          </p>
        )}

        <button className="login-btn">
          Verificar
        </button>

        <div className="login-links">
          <a href="/register">Volver al registro</a>
        </div>

      </form>

    </div>

  );

}

export default Verificacion_de_seguridad;