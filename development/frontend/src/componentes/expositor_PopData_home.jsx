import carabineros from "../assets/carabineros_logo.png";
import inapi from "../assets/inapi_logo.jpg";
import mineria from "../assets/Min_mineria.png";
import odepa from "../assets/odepa_logo.jpg";
import rectoria from "../assets/rectoria_logo.png";
import sisib from "../assets/Sisib_logo.png";

import "../styles/componentes_styles/expositor_PopData.css";

function Expositor_PopData() {
  const items = [
    {
      id: 1,
      title: "precios al consumidor",
      description: "conjuntos de datos de precios al consumidor de los principales alimentos de la canasta familiar.",
      image: odepa,
    },
    {
      id: 2,
      title: "consumo y uso de agua en mineria",
      description: "Tablas de datos relacionados con el consumo de agua por parte de las empresas mineras, desde el año 2009",
      image: mineria,
    },
    {
      id: 3,
      title: "registros de patentes",
      description: "registros de patentes a nivel nacional, desde el año 2002",
      image: inapi,
    },
    {
      id: 4,
      title: "cuadro estadistico de llamadas a nivel 133",
      description: "cuadro estadistico de llamadas al nivel 133 de carabineros de chile, año 2012.",
      image: carabineros,
    },
    {
      id: 5,
      title: "recaudacion total ingresos privados",
      description: "Recaudacion obtenida por el pago de servicios solicitados por usuarios del DDI, Años 2011 - 2012.",
      image: sisib,
    },
    {
      id: 6,
      title: "matricula total de doctorado del CRUCH",
      description: "informacion estadistica de las matriculas totales de doctorado, la informacion es generada por cada una de las universidades miembros.",
      image: rectoria,
    },
  ];

  return (
    <section className="expositor-wrapper">
      <div className="expositor-popdata">
        {/* Encabezado */}
        <div className="expositor-header">
          <h2>Datos populares</h2>
          <p>Explore los conjuntos de datos más consultados y relevantes del observatorio</p>
          <hr className="expositor-separator" />
        </div>
        

        {/* Grid */}
        <div className="expositor-grid">
          {items.map((item) => (
            <div key={item.id} className="expositor-card">
              <img
                src={item.image}
                alt={item.title}
                className="card-image"
              />

              <div className="card-content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>

                <button className="card-button">
                  Ir a ver
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Expositor_PopData;
