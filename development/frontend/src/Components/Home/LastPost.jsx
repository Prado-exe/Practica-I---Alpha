import {lastPosts} from "../../data/LastPosts.js";
import "../../styles/component_styles/LastPost.css";

function LastPost() {
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
          {lastPosts.map((item) => (
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

export default LastPost;