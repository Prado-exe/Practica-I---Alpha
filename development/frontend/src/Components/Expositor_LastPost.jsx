import articulo1 from "../assets/sostenibilidad.jpg";
import articulo2 from "../assets/viviendas.jpg";
import articulo3 from "../assets/transaccion.jpg";

import "../styles/component_styles/Expositor_LastPost.css";

function Expositor_UltPublic() {
  const items = [
    {
      id: 1,
      title: "Informe anual de indicadores de desarrollo sostenible 2025",
      description:
        "El desarrollo sostenible es un proceso dinámico que requiere información clara y actualizada para comprender sus avances y desafíos. Este informe reúne el estado y la evolución de los principales indicadores durante 2025, incorporando análisis comparativos y tendencias territoriales.",
      image: articulo1,
      category: "Informe",
    },
    {
      id: 2,
      title: "Explorando las tendencias de la vivienda con datos abiertos",
      description:
        "Las viviendas determinan la comodidad, seguridad y calidad de vida de las personas. Sin embargo, encontrar y permitirse un lugar adecuado para vivir se ha vuelto cada vez más difícil en muchas regiones debido al aumento de precios.",
      image: articulo2,
      category: "Análisis",
    },
    {
      id: 3,
      title:
        "La transición a los pagos digitales y el comportamiento de pago",
      description:
        "Los pagos digitales se están convirtiendo en una realidad cotidiana en Chile. Al ofrecer rapidez y comodidad, están transformando la forma en que las personas compran bienes y servicios.",
      image: articulo3,
      category: "Datos abiertos",
    },
  ];

  return (
    <section className="ultpublic-wrapper">
      <div className="ultpublic-container">
        
        <div className="ultpublic-header">
          <h2>Últimas publicaciones</h2>
          <p>
            Revise los artículos y análisis más recientes publicados en el
            observatorio.
          </p>
          <hr className="ultpublic-separator" />
        </div>

        <div className="ultpublic-grid">
          {items.map((item) => (
            <article key={item.id} className="ultpublic-card">
              
              <div className="ultpublic-image-container">
                <img src={item.image} alt={item.title} />
              </div>

              <div className="ultpublic-card-content">

                <span className="ultpublic-category">
                  {item.category}
                </span>

                <h3>{item.title}</h3>

                <p>{item.description}</p>

                <button className="ultpublic-card-button">
                  Leer publicación
                </button>

              </div>

            </article>
          ))}
        </div>

      </div>
    </section>
  );
}

export default Expositor_UltPublic;