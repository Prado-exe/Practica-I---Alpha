import carabineros from "../assets/carabineros_logo.png";
import inapi from "../assets/inapi_logo.jpg";
import mineria from "../assets/Min_mineria.png";
import odepa from "../assets/odepa_logo.jpg";
import rectoria from "../assets/rectoria_logo.png";
import sisib from "../assets/Sisib_logo.png";

import "../styles/component_styles/Expositor_PopularData.css";

function Expositor_PopularData() {

  const items = [
    {
      id: 1,
      title: "Precios al consumidor",
      description:
        "Conjuntos de datos de precios al consumidor de los principales alimentos de la canasta familiar.",
      category: "Economía",
      image: odepa,
    },
    {
      id: 2,
      title: "Consumo y uso de agua en minería",
      description:
        "Tablas de datos relacionados con el consumo de agua por parte de las empresas mineras desde el año 2009.",
      category: "Minería",
      image: mineria,
    },
    {
      id: 3,
      title: "Registros de patentes",
      description:
        "Registros de patentes a nivel nacional desde el año 2002.",
      category: "Innovación",
      image: inapi,
    },
    {
      id: 4,
      title: "Cuadro estadístico de llamadas 133",
      description:
        "Cuadro estadístico de llamadas al nivel 133 de Carabineros de Chile durante el año 2012.",
      category: "Seguridad",
      image: carabineros,
    },
    {
      id: 5,
      title: "Recaudación total ingresos privados",
      description:
        "Recaudación obtenida por el pago de servicios solicitados por usuarios del DDI entre los años 2011 y 2012.",
      category: "Finanzas",
      image: sisib,
    },
    {
      id: 6,
      title: "Matrícula total de doctorado CRUCH",
      description:
        "Información estadística de las matrículas totales de doctorado generada por universidades miembros.",
      category: "Educación",
      image: rectoria,
    },
  ];

  return (
    <section className="expositor-wrapper">
      <div className="expositor-popdata">

        <div className="expositor-header">
          <h2>Datos populares</h2>
          <p>
            Explore los conjuntos de datos más consultados y relevantes del observatorio
          </p>
          <hr className="expositor-separator" />
        </div>

        <div className="expositor-grid">
          {items.map((item) => (
            <div key={item.id} className="expositor-card">

              <div className="card-image-container">
                <img
                  src={item.image}
                  alt={item.title}
                  className="card-image"
                />
              </div>

              <div className="card-content">

                <span className="card-category">
                  {item.category}
                </span>

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

export default Expositor_PopularData;