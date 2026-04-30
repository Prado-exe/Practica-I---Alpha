import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/pages_styles/Login.css";
import logo from "../assets/content.png";
import Captcha from "../Components/Subcomponents/Captcha";
import { useAuth } from "../Context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Login() {
  // 1. Iniciamos el hook de navegación
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 2. Estado para almacenar la respuesta del Captcha
  //const [captchaToken, setCaptchaToken] = useState(null); 
  
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();

   // if (!captchaToken) {
   //   alert("Debes completar el captcha");
   //   return;
   // }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include", 
        body: JSON.stringify({
          email,
          password,
          //captchaToken
        })
      });

      const data = await response.json();
      console.log("Respuesta backend:", data);

      // 4. RECUPERAMOS LA TRAMPA: Si el backend pide revalidar, enviamos al código
      if (response.ok && data.requiresRevalidation) {
        alert(data.message);
        navigate("/verificacion", { state: { email: data.email } });
        return; 
      }

      // 5. LOGIN NORMAL EXITOSO
      if (response.ok && data.ok) {
        
        // 👇 1. Aplanamos el objeto: sacamos todo lo de 'account' a la raíz
        const usuarioAplanado = {
          ...data.account, // Esto extrae email, role, permissions, etc.
          token: data.token,
          expiresAt: data.expiresAt
        };

        // 👇 2. Ahora sí, le pasamos el usuario perfecto al contexto
        login(usuarioAplanado);

        // Disparamos el evento para que el SessionExpiryManager lo detecte
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
        <Link to="/register">Registrarse  </Link>
        <Link to="/recuperar-password"> ¿Olvidaste tu contraseña?</Link>
      </div>

      <div className="back-to-home">
        <Link to="/">Volver al inicio</Link>
      </div>
    </form>
  );
}

export default Login;