import { useLocation, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import "../styles/pages_styles/VerificacionSeguridad.css";
import logo from "../assets/content.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Verificacion_de_seguridad() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // 👇 Nuevo estado para éxito
  const [loading, setLoading] = useState(false);

  const verificarCodigo = async (e) => {
    e.preventDefault();
    // 1. Limpiamos ambos estados al iniciar
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/verificar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          codigo
        })
      });

      const data = await response.json();

      // 👇 LA CORRECCIÓN CLAVE: Solo validamos response.ok
      // Si el servidor responde con un estado 200 (Éxito), entramos aquí.
      if (response.ok) {
        
        // 2. Activamos el mensaje verde
        setSuccess("¡Cuenta verificada con éxito! Redirigiendo al login...");
        
        // 3. Ejecutamos la redirección automática después de 2 segundos
        setTimeout(() => {
          navigate("/login"); 
        }, 2000);

      } else {
        // Solo entraremos aquí si el servidor devuelve un error 400 o 500 (Código incorrecto)
        setError(data.message || "El código ingresado es incorrecto");
      }

    } catch(err) {
      console.error(err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ELIMINADO EL div.login-bg - El form ahora es la raíz
    <form
      className="login-container"
      onSubmit={verificarCodigo}
    >
      <img src={logo} alt="Logo del sitio" className="login-logo"/>

      <h2 className="verification-title">
        Verificación de seguridad
      </h2>

      <p className="verification-text">
        Hemos enviado un código a <b>{email || "tu correo"}</b>
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
        disabled={success !== ""} // Bloquea el input si ya se verificó
      />

      {/* MENSAJE DE ERROR (Saldrá en rojo) */}
      {error && (
        <div className="verification-error">
          {error}
        </div>
      )}

      {/* MENSAJE DE ÉXITO (Saldrá en verde) */}
      {success && (
        <div className="verification-success">
          ✓ {success}
        </div>
      )}

      <button className="login-btn" disabled={loading || success !== ""}>
        {loading ? "Verificando..." : success ? "Verificado" : "Verificar"}
      </button>

      {/* CONTENEDOR ESTANDARIZADO PARA VOLVER */}
      <div className="back-to-home">
        <Link to="/register">← Volver al registro</Link>
      </div>

    </form>
  );
}

export default Verificacion_de_seguridad;