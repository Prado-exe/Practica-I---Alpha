import "../../Styles/ComponentStyle/Common/Loader.css";

function Loader() {
  return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p>Cargando...</p>
    </div>
  );
}

export default Loader;