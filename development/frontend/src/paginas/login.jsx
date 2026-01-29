import "../styles/paginas_styles/Login.css";
import logo from "../assets/content.png"; // ajusta la ruta

function Login() {
  return (
    <div className="login-bg">
      <div className="login-container">
        {/* Logo */}
        <img src={logo} alt="Logo" className="login-logo" />

        {/* Correo */}
        <label>Correo electrónico</label>
        <input
          type="email"
          placeholder="correo@ejemplo.cl"
          className="login-input"
        />

        {/* Contraseña */}
        <label>Contraseña</label>
        <input
          type="password"
          placeholder="••••••••"
          className="login-input"
        />

        {/* Captcha fake */}
        <div className="captcha">
          <input type="checkbox" />
          <span>No soy un robot</span>
        </div>

        {/* Botón */}
        <button className="login-btn">Iniciar sesión</button>

        {/* Links */}
        <div className="login-links">
          <a href="/register">Registrarse</a>
          <a href="/forgot">¿Olvidaste tu contraseña?</a>
        </div>
      </div>
    </div>
  );
}

export default Login;
