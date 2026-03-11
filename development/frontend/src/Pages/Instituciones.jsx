import "../Styles/Pages_styles/Instituciones.css";

function Instituciones() {

  const instituciones = [
    {
      id: 1,
      nombre: "Ministerio de Salud",
      descripcion: "Datos relacionados con salud pública y hospitales.",
      datasets: 12,
      logo: "https://via.placeholder.com/80"
    },
    {
      id: 2,
      nombre: "Ministerio de Vivienda",
      descripcion: "Información sobre viviendas y urbanismo.",
      datasets: 8,
      logo: "https://via.placeholder.com/80"
    },
    {
      id: 3,
      nombre: "Municipalidad",
      descripcion: "Datos municipales y administración local.",
      datasets: 5,
      logo: "https://via.placeholder.com/80"
    },
    {
      id: 4,
      nombre: "Ministerio de Transporte",
      descripcion: "Datos sobre transporte público e infraestructura.",
      datasets: 9,
      logo: "https://via.placeholder.com/80"
    },
  ];

  return (
    <main className="instituciones-page">

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Home</span>
        <span className="separator"> &gt; </span>
        <span className="current">Instituciones</span>
      </div>

      {/* Grid */}
      <div className="instituciones-grid">
        {instituciones.map((inst) => (
          <div key={inst.id} className="institucion-card">

            <div className="card-header">
              <img src={inst.logo} alt={inst.nombre} />
              <h3>{inst.nombre}</h3>
            </div>

            <p className="descripcion">{inst.descripcion}</p>

            <div className="card-footer">
              <span className="dataset-count">
                {inst.datasets} datasets
              </span>

              <button className="ver-btn">
                Ver institución
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Paginador */}
      <div className="paginador">
        <button className="page-btn">«</button>
        <button className="page-btn active">1</button>
        <button className="page-btn">2</button>
        <button className="page-btn">3</button>
        <button className="page-btn">»</button>
      </div>

    </main>
  );
}

export default Instituciones;