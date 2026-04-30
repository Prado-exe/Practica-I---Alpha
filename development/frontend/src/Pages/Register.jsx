import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/pages_styles/register.css"; // Asegúrate de que la ruta sea correcta
import logo from "../assets/content.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (pass) => {
  const minLength = pass.length >= 8;
  const hasUpper = /[A-Z]/.test(pass);
  const hasLower = /[a-z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSymbol = /[^A-Za-z0-9]/.test(pass);

    return {
      isValid: minLength && hasUpper && hasLower && hasNumber && hasSymbol,
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSymbol
    };
  };

  const passwordValidation = validatePassword(password);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!passwordValidation.isValid) {
      alert("La contraseña no cumple con los requisitos de seguridad");
      return;
}
    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          password
        })
      });

      const data = await response.json();
      console.log("Respuesta backend:", data);

      if (response.ok) {
        navigate("/verificacion", {
          state: { email }
        });
      } else {
        alert(data.message || "Error en el registro");
      }
    } catch (error) {
      console.error("Error conexión backend:", error);
      alert("No se pudo conectar con el backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ELIMINADO EL div.login-bg - Ahora el form es la raíz
    <form
      className="login-container"
      onSubmit={handleRegister}
      aria-label="Formulario de registro"
    >
      <img src={logo} alt="Logo del sitio" className="login-logo" />

      <label htmlFor="name">Nombre completo</label>
      <input
        id="name"
        type="text"
        placeholder="Juan Pérez"
        className="login-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

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
      <div className="password-error">
        <p>La contraseña debe contener:</p>
        <ul>
          <li style={{ color: passwordValidation.minLength ? "green" : "red" }}>
            Mínimo 8 caracteres
          </li>
          <li style={{ color: passwordValidation.hasUpper ? "green" : "red" }}>
            Una mayúscula
          </li>
          <li style={{ color: passwordValidation.hasLower ? "green" : "red" }}>
            Una minúscula
          </li>
          <li style={{ color: passwordValidation.hasNumber ? "green" : "red" }}>
            Un número
          </li>
          <li style={{ color: passwordValidation.hasSymbol ? "green" : "red" }}>
            Un símbolo
          </li>
        </ul>
      </div>

      <label htmlFor="confirmPassword">Confirmar contraseña</label>
      <input
        id="confirmPassword"
        type="password"
        placeholder="••••••••"
        className="login-input"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <button className="login-btn" disabled={loading || !passwordValidation.isValid}>
        {loading ? "Registrando..." : "Registrarse"}
      </button>

      <div className="login-links">
        <Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
      </div>

      {/* NUEVO LINK PARA VOLVER AL INICIO */}
      <div className="back-to-home">
        <Link to="/">Volver al inicio</Link>
      </div>
    </form>
  );
}

export default Register;