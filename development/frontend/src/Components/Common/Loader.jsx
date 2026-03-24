import "../../Styles/ComponentStyle/Common/Loader.css";
import logo from "../../assets/contentv2.png";

function Loader() {
  return (
    <div className="loader-container">
      <img src={logo} alt="Logo" className="loader-logo" />
      <p>Cargando...</p>
    </div>
  );
}

export default Loader;