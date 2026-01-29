import "../styles/paginas_styles/register.css";
import logo from "../assets/content.png";

function Register() {
  return (
    <div className="login-bg">
      <div className="login-container">
        {/* Logo */}
        <img src={logo} alt="Logo" className="login-logo" />

        {/* Nombre completo */}
        <label>Nombre completo</label>
        <input
          type="text"
          placeholder="Juan Pérez"
          className="login-input"
        />

        {/* Correo */}
        <label>Correo electrónico</label>
        <input
          type="email"
          placeholder="correo@ejemplo.cl"
          className="login-input"
        />

        {/* Institución (opcional) */}
        <label>Institución u organización (opcional)</label>
        <input
          type="text"
          placeholder="Universidad / Empresa"
          className="login-input"
        />

        {/* Contraseña */}
        <label>Contraseña</label>
        <input
          type="password"
          placeholder="••••••••"
          className="login-input"
        />

        {/* Confirmación */}
        <label>Confirmar contraseña</label>
        <input
          type="password"
          placeholder="••••••••"
          className="login-input"
        />

        {/* Captcha temporal */}
        <div className="captcha">
          <input type="checkbox" />
          <span>No soy un robot</span>
        </div>

        {/* Botón */}
        <button className="login-btn">Registrarse</button>

        {/* Links */}
        <div className="login-links">
          <a href="/login">¿Ya tienes cuenta? Inicia sesión</a>
        </div>
      </div>
    </div>
  );
}

export default Register;
