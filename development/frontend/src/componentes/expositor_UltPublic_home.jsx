import articulo1 from "../assets/sostenibilidad.jpg";
import articulo2 from "../assets/viviendas.jpg";
import articulo3 from "../assets/transaccion.jpg";

import "../styles/componentes_styles/expositor_UltPublic.css";


function Expositor_UltPublic() {
  const items = [
    {
      id: 1,
      title: "informe anual de indicadores de desarrollo sostenible 2025",
      description: "El desarrollo sostenible es un proceso dinamico que requiere informacion clara y actualziada para comprender sus avances y desafios, este informe reune el estado y la evolucion de los principales indicadores de desarrollo sostenible durante el año 2025, incorporando analisis comparativos, tendencias territoriales y su relacion con los objetivos de desarrollo9 sostenible (ODS).",
      image: articulo1,
    },
    {
      id: 2,
      title: "explorando las tendencias de la vivienda con datos abiertos",
      description: "Las viviendas son el lugar donde las personas pasan la mayor parte del tiempo, lo que determina su comodidad, seguridad y calidad de vida, sin embargo, encontrar y poder permitirse un lugar adecuado para vivir se ha vuelto cada vez mas dificil en toda america. el aumento de los precios y la evolucion de la economia estan ejerciendo presion sobre los hogares en muchas regiones.",
      image: articulo2,
    },
    {
      id: 3,
      title: "la transicion a los pagos digitales, comprender el comportamiento de pago a travez de datos abiertos",
      description: "¿Sigues pagando principalmente en efectivo o el telefono ha reemplazado a la cartera? sea cual sea tu respuesta, en todo chile, los pagos digitales se estan convirtiendo en una realidad cotidiana. al ofrecer velocidad, comodidad y nuevas formas de realizar transacciones, estan transformando la forma en que las personas cocmpran bienes y servicios.",
      image: articulo3,
    },
  ];

  return (
    <section className="ultpublic-wrapper">
      <div className="ultpublic-container">
        {/* Encabezado */}
        <div className="ultpublic-header">
          <h2>Últimas publicaciones</h2>
          <p>Revise los artículos y datos más recientes publicados en el observatorio.</p>
          <hr className="ultpublic-separator" />
        </div>

        {/* Grid vertical */}
        <div className="ultpublic-grid">
          {items.map((item) => (
            <div key={item.id} className="ultpublic-card">
              <img
                src={item.image}
                alt={item.title}
                className="ultpublic-card-image"
              />
              <div className="ultpublic-card-content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <button className="ultpublic-card-button">Ir a leer</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Expositor_UltPublic;
