function InstitucionCard({ institucion }) {

  return (
    <article
      className="institucion-card"
      aria-labelledby={`inst-${institucion.id}`}
    >

      <div className="card-header">
        <img
          src={institucion.logo}
          alt={`Logo de ${institucion.nombre}`}
        />

        <h3 id={`inst-${institucion.id}`}>
          {institucion.nombre}
        </h3>
      </div>

      <p className="descripcion">
        {institucion.descripcion}
      </p>

      <div className="card-footer">

        <span
          className="dataset-count"
          aria-label={`${institucion.datasets} conjuntos de datos`}
        >
          {institucion.datasets} datasets
        </span>

        <button
          className="ver-btn"
          aria-label={`Ver datasets de ${institucion.nombre}`}
        >
          Ver institución
        </button>

      </div>

    </article>
  );
}

export default InstitucionCard;