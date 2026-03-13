import "../Styles/Pages_styles/Noticias.css";

function Noticias() {
  return (
    <main className="news-page">

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Home</span>
        <span className="separator"> &gt; </span>
        <span className="current">Noticias</span>
      </div>

      <div className="news-container">

        {/* FILTROS */}
        <aside className="filters-panel">

          <details open>
            <summary>Categorías</summary>
            <div className="filter-content">
              <label><input type="checkbox" /> Tecnología</label>
              <label><input type="checkbox" /> Sociedad</label>
              <label><input type="checkbox" /> Medio Ambiente</label>
            </div>
          </details>

          <details>
            <summary>Año</summary>
            <div className="filter-content">
              <label><input type="checkbox" /> 2024</label>
              <label><input type="checkbox" /> 2023</label>
              <label><input type="checkbox" /> 2022</label>
            </div>
          </details>

        </aside>


        {/* RESULTADOS */}
        <section className="news-results">

          {/* Barra superior */}
          <div className="news-topbar">

            <input
              type="text"
              placeholder="Buscar noticias..."
              className="news-search"
            />

            <select className="news-sort">
              <option>Más recientes</option>
              <option>Más antiguas</option>
              <option>Alfabético</option>
            </select>

          </div>

          {/* contador */}
          <p className="news-count">
            Mostrando <strong>6</strong> noticias
          </p>


          {/* LISTADO */}
          <div className="news-list">

            {/* NOTICIA 1 */}
            <div className="news-card">

              <img
                src="/img/noticia1.jpg"
                alt="Imagen noticia"
                className="news-image"
              />

              <div className="news-content">

                <h3>Nuevo portal de datos abiertos mejora acceso ciudadano</h3>

                <p className="news-date">
                  Publicado: <strong>12 Marzo 2024</strong>
                </p>

                <p>
                  El nuevo portal facilita la consulta de conjuntos de datos
                  públicos, permitiendo a ciudadanos e investigadores acceder
                  a información de manera más rápida y transparente.
                </p>

                <div className="news-meta">
                  <span className="tag">Gobierno</span>
                  <span className="tag">Tecnología</span>
                </div>

                <div className="news-footer">
                  <button className="news-btn">Leer noticia</button>
                </div>

              </div>
            </div>


            {/* NOTICIA 2 */}
            <div className="news-card">

              <img
                src="/img/noticia2.jpg"
                alt="Imagen noticia"
                className="news-image"
              />

              <div className="news-content">

                <h3>Investigación revela avances en sostenibilidad urbana</h3>

                <p className="news-date">
                  Publicado: <strong>5 Enero 2024</strong>
                </p>

                <p>
                  Un estudio reciente muestra cómo las ciudades pueden mejorar
                  su sostenibilidad mediante políticas públicas basadas en
                  datos abiertos y participación ciudadana.
                </p>

                <div className="news-meta">
                  <span className="tag">Investigación</span>
                  <span className="tag">Medio Ambiente</span>
                </div>

                <div className="news-footer">
                  <button className="news-btn">Leer noticia</button>
                </div>

              </div>
            </div>

          </div>


          {/* PAGINACIÓN */}
          <div className="news-pagination">

            <button>Anterior</button>
            <button className="active">1</button>
            <button>2</button>
            <button>3</button>
            <button>Siguiente</button>

          </div>

        </section>

      </div>

    </main>
  );
}

export default Noticias;