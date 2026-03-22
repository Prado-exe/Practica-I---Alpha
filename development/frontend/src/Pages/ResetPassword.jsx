import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "../styles/pages_styles/RecuperarContrasena.css"; // reutiliza el mismo CSS
import logo from "../assets/content.png";


function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // 👇 1. Agregamos el estado para manejar los errores visuales
  const [errorMsg, setErrorMsg] = useState("");

  // Utilizamos la variable de entorno para el fetch
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (password !== confirm) {
      alert("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    try {
      setLoading(true);
      
      // 👇 Corrección aquí para que use API_URL
      const response = await fetch(`${API_URL}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.ok) {
        setSuccess(true);
      } else {
        setErrorMsg(data.message || "Error al actualizar la contraseña.");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("Error de conexión con el servidor. Intente más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <form className="login-container" onSubmit={handleSubmit}>
        <img src={logo} alt="Logo" className="login-logo" />

        {!success ? (
          <>
            <h2 className="recover-title">Nueva contraseña</h2>
            <p className="recover-description">Ingresa tu nueva contraseña para recuperar tu cuenta.</p>
            
            {/* 👇 4. Mostramos el cuadro de error si errorMsg tiene texto */}
            {errorMsg && (
              <div style={{ backgroundColor: "#ffebee", color: "#c62828", padding: "10px", borderRadius: "5px", marginBottom: "15px", fontSize: "14px", textAlign: "center" }}>
                {errorMsg}
              </div>
            )}

            <label>Nueva contraseña</label>
            <input
              type="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <label>Confirmar contraseña</label>
            <input
              type="password"
              className="login-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />

            <button className="login-btn" disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </>
        ) : (
          <div className="recover-sent">
            <div className="mail-icon">✔</div>
            <h2>Contraseña actualizada</h2>
            <p>Tu contraseña ha sido actualizada correctamente.</p>
            <Link to="/login" className="recover-back-btn">Ir al login</Link>
          </div>
        )}
      </form>
    </div>
  );
}

export default ResetPassword;