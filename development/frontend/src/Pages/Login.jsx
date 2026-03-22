import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/pages_styles/Login.css";
import logo from "../assets/content.png";
import { setAuthSession } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();
      console.log("Respuesta backend:", data);

      // 👇 1. LA TRAMPA: Si el backend pide revalidar, cortamos aquí y enviamos al código
      if (response.ok && data.requiresRevalidation) {
        alert(data.message);
        navigate("/verificacion", { state: { email: data.email } });
        return; 
      }

      // 👇 2. LOGIN NORMAL: Solo pasa si hay tokens reales
      if (response.ok && data.ok) {
        setAuthSession({
          token: data.token,
          user: data.account,
          expiresAt: data.expiresAt,
        });
        window.dispatchEvent(new Event("auth-changed"));
        navigate("/");
      } else {
        alert(data.message || "Error al iniciar sesión");
      }
    } catch (error) {
      console.error("Error conexión backend:", error);
      alert("No se pudo conectar con el backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <form
        className="login-container"
        onSubmit={handleLogin}
        aria-label="Formulario de inicio de sesión"
      >
        <img src={logo} alt="Logo del sitio" className="login-logo" />

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

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="login-btn" disabled={loading}>
          {loading ? "Validando..." : "Iniciar sesión"}
        </button>

        <div className="login-links">
          <Link to="/register">Registrarse</Link>
          <Link to="/recuperar-password">¿Olvidaste tu contraseña?</Link>
        </div>
      </form>
    </div>
  );
}

export default Login;