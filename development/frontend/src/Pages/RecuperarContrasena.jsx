import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/pages_styles/RecuperarContrasena.css"; // Asegúrate de la ruta
import logo from "../assets/content.png";

function RecuperarContrasena() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Declaramos la variable para no tener "localhost" quemado
  const API_URL = import.meta.env.VITE_API_URL || "http://3.139.202.192:3000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/recuperar-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      console.log(data);
      if (response.ok) setSent(true);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    // ELIMINADO EL div.login-bg - Ahora el form es la raíz
    <form className="login-container" onSubmit={handleSubmit}>
      <img src={logo} alt="Logo" className="login-logo" />

      {!sent ? (
        <>
          <h2 className="recover-title">Recuperar contraseña</h2>
          <p className="recover-description">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            placeholder="correo@ejemplo.cl"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button className="login-btn" disabled={loading}>
            {loading ? "Enviando..." : "Enviar enlace de recuperación"}
          </button>
        </>
      ) : (
        <div className="recover-sent">
          <div className="mail-icon">✉</div>
          <h2>Correo enviado</h2>
          <p>Hemos enviado un enlace de recuperación a tu correo electrónico.</p>
          <p className="recover-small">Revisa tu bandeja de entrada y sigue las instrucciones para continuar.</p>

          <button
            type="button"
            className="resend-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Reenviando..." : "Reenviar correo"}
          </button>
        </div>
      )}

      <div className="back-to-home">
        <Link to="/login">Volver al login</Link> 
      </div>
    </form>
  );
}

export default RecuperarContrasena;