import { useState } from "react";
import "../styles/pages_styles/Login.css";
import logo from "../assets/content.png";
import Captcha from "../Components/Subcomponents/Captcha";
import { Link } from "react-router-dom";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {

    e.preventDefault();

    if (!captchaToken) {
      alert("Debes completar el captcha");
      return;
    }

    try {

      setLoading(true);

      const response = await fetch("http://localhost:3000/api/login", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          email,
          password,
          captchaToken
        })

      });

      const data = await response.json();

      console.log("Respuesta backend:", data);

    } catch (error) {

      console.error("Error conexión backend:", error);

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
          onChange={(e)=>setEmail(e.target.value)}
          required
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          className="login-input"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          required
        />

        <Captcha onVerify={setCaptchaToken} />

        <button className="login-btn" disabled={loading}>
          {loading ? "Validando..." : "Iniciar sesión"}
        </button>

        <div className="login-links">
          <div className="login-links">
            <Link to="/register">Registrarse</Link>
            <Link to="/Recuperar_Contraseña">¿Olvidaste tu contraseña?</Link>
          </div>
        </div>

      </form>

    </div>
  );
}

export default Login;

