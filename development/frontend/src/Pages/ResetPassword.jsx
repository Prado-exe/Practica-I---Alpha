import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "../styles/pages_styles/Recuperar_contraseña.css"; // reutiliza el mismo CSS
import logo from "../assets/content.png";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      alert("Las contraseñas no coinciden");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const data = await response.json();
      if (response.ok) setSuccess(true);
    } catch (error) {
      console.error(error);
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