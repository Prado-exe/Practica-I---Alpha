import { popularData } from "../../data/popularData";
import "../../styles/Component_styles/PopularData.css";

function PopularData() {
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
          {popularData.map((item) => (
            <article key={item.id} className="expositor-card">
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
                  Ver dataset
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PopularData;