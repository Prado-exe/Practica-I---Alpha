import "../Styles/Pages_styles/Publicaciones.css";

function Publicaciones() {
  return (
    <main className="datasets-page">

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Home</span>
        <span className="separator"> &gt; </span>
        <span className="current">Publicaciones</span>
      </div>

      <div className="datasets-container">

        {/* FILTROS */}
        <aside className="filters-panel">

          <details open>
            <summary>Categorías</summary>
            <div className="filter-content">
              <label><input type="checkbox" /> Tecnología</label>
              <label><input type="checkbox" /> Medio Ambiente</label>
              <label><input type="checkbox" /> Economía</label>
            </div>
          </details>

          <details>
            <summary>Año de publicación</summary>
            <div className="filter-content">
              <label><input type="checkbox" /> 2024</label>
              <label><input type="checkbox" /> 2023</label>
              <label><input type="checkbox" /> 2022</label>
            </div>
          </details>

        </aside>


        {/* RESULTADOS */}
        <section className="datasets-results">

          {/* Barra superior */}
          <div className="datasets-topbar">

            <input
              type="text"
              placeholder="Buscar publicaciones..."
              className="datasets-search"
            />

            <select className="datasets-sort">
              <option>Más recientes</option>
              <option>Más antiguos</option>
              <option>Alfabético</option>
            </select>

          </div>

          {/* contador */}
          <p className="datasets-count">
            Mostrando <strong>6</strong> publicaciones
          </p>


          {/* listado */}
          <div className="datasets-list">

            <div className="dataset-card publication-card">

              <img
                src="/img/publicacion1.jpg"
                alt="Portada publicación"
                className="publication-image"
              />

              <div className="publication-content">
                <h3>Análisis de sostenibilidad urbana</h3>

                <p className="publication-author">
                  Por <strong>María González</strong>
                </p>

                <p>
                  Estudio sobre el impacto de políticas urbanas sostenibles en
                  ciudades latinoamericanas y su relación con los objetivos de
                  desarrollo sostenible.
                </p>

                <div className="dataset-meta">
                  <span className="tag">Investigación</span>
                  <span className="tag">Medio Ambiente</span>
                </div>

                <div className="dataset-footer">
                  <span>Publicado: 2024</span>
                  <button className="dataset-btn">Ver publicación</button>
                </div>
              </div>

            </div>


            <div className="dataset-card publication-card">

              <img
                src="/img/publicacion2.jpg"
                alt="Portada publicación"
                className="publication-image"
              />

              <div className="publication-content">
                <h3>Transformación digital en gobiernos locales</h3>

                <p className="publication-author">
                  Por <strong>Carlos Ramírez</strong>
                </p>

                <p>
                  Documento que analiza la adopción de tecnologías digitales en
                  administraciones públicas y su impacto en la eficiencia del
                  servicio ciudadano.
                </p>

                <div className="dataset-meta">
                  <span className="tag">Tecnología</span>
                  <span className="tag">Gobierno</span>
                </div>

                <div className="dataset-footer">
                  <span>Publicado: 2023</span>
                  <button className="dataset-btn">Ver publicación</button>
                </div>
              </div>

            </div>

          </div>


          {/* paginación */}
          <div className="datasets-pagination">

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

export default Publicaciones;