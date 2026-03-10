import "../Styles/Pages_styles/ConjuntoDatos.css";

function ConjuntoDatos() {
  return (
    <main className="datasets-page">

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Home</span>
        <span className="separator"> &gt; </span>
        <span className="current">Conjunto de datos</span>
      </div>

      <div className="datasets-container">

        {/* FILTROS */}
        <aside className="filters-panel">

          <details open>
            <summary>Organizaciones</summary>
            <div className="filter-content">
              <label><input type="checkbox" /> Organización 1</label>
              <label><input type="checkbox" /> Organización 2</label>
            </div>
          </details>

          <details>
            <summary>Categorías</summary>
            <div className="filter-content">
              <label><input type="checkbox" /> Categoría 1</label>
              <label><input type="checkbox" /> Categoría 2</label>
            </div>
          </details>

          <details>
            <summary>Etiquetas</summary>
            <div className="filter-content">
              <label><input type="checkbox" /> Etiqueta 1</label>
              <label><input type="checkbox" /> Etiqueta 2</label>
            </div>
          </details>

          <details>
            <summary>Formato</summary>
            <div className="filter-content">
              <label><input type="checkbox" /> CSV</label>
              <label><input type="checkbox" /> JSON</label>
              <label><input type="checkbox" /> XLSX</label>
            </div>
          </details>

          <details>
            <summary>Licencias</summary>
            <div className="filter-content">
              <label><input type="checkbox" /> Licencia 1</label>
              <label><input type="checkbox" /> Licencia 2</label>
            </div>
          </details>

          <details>
            <summary>Objetivos ODS</summary>
            <div className="filter-content">
              <label><input type="checkbox" /> ODS 1</label>
              <label><input type="checkbox" /> ODS 2</label>
            </div>
          </details>

          <details>
            <summary>Filtrar por fecha</summary>
            <div className="filter-content">
              <label>Fecha inicio</label>
              <input type="date"/>

              <label>Fecha fin</label>
              <input type="date"/>
            </div>
          </details>

        </aside>


        {/* RESULTADOS */}
        <section className="datasets-results">
        {/* Barra superior */}
        <div className="datasets-topbar">

            <input
            type="text"
            placeholder="Buscar conjuntos de datos..."
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
            Mostrando <strong>6</strong> conjuntos de datos
        </p>


        {/* listado */}
        <div className="datasets-list">

            <div className="dataset-card">
            <h3>Datos de población regional</h3>
            <p>
                Información estadística sobre la población distribuida por región
                y rango etario.
            </p>

            <div className="dataset-meta">
                <span className="tag">CSV</span>
                <span className="tag">Estadísticas</span>
                <span className="tag">ODS 10</span>
            </div>

            <div className="dataset-footer">
                <span>Actualizado: 2024</span>
                <button className="dataset-btn">Ver dataset</button>
            </div>
            </div>


            <div className="dataset-card">
            <h3>Infraestructura pública</h3>
            <p>
                Catastro de infraestructura pública disponible en distintas
                comunas del país.
            </p>

            <div className="dataset-meta">
                <span className="tag">JSON</span>
                <span className="tag">Infraestructura</span>
            </div>

            <div className="dataset-footer">
                <span>Actualizado: 2023</span>
                <button className="dataset-btn">Ver dataset</button>
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

export default ConjuntoDatos;