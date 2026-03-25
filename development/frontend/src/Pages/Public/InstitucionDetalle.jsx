import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import AccordionFilter from "../../Components/Common/AccordionFilter";
import "../../Styles/Pages_styles/Public/InstitucionDetalle.css";

function InstitucionDetalle() {
  const { id } = useParams();

  const [institucion, setInstitucion] = useState(null);
  const [datasets, setDatasets] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resInst = await fetch(`/api/instituciones/${id}`);
        const dataInst = await resInst.json();

        const resData = await fetch(`/api/instituciones/${id}/datasets`);
        const dataSets = await resData.json();

        setInstitucion(dataInst);
        setDatasets(dataSets);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [id]);

  if (!institucion) return <p>Cargando...</p>;

  return (
    <div className="institucion-layout">

      {/* 🟪 IZQUIERDA */}
      <aside className="left-column">

        {/* 🔹 CONTENEDOR 1: INFO */}
        <div className="card info-card">
          <img
            src={institucion.logo}
            alt={institucion.nombre}
          />
          <h2>{institucion.nombre}</h2>
          <p>{institucion.descripcion}</p>
        </div>

        {/* 🔹 CONTENEDOR 2: FILTROS */}
        <div className="card filter-card">
          <h3>Filtros</h3>
          <AccordionFilter />
        </div>

      </aside>

      {/* 🟦 DERECHA */}
      <main className="right-column">

        {/* 🔸 CONTENEDOR GRANDE: DASHBOARD */}
        <div className="card dashboard-card">
          <h2>Datasets</h2>

          {datasets.length === 0 ? (
            <p>No hay datasets</p>
          ) : (
            <div className="datasets-grid">
              {datasets.map((ds) => (
                <div key={ds.id} className="dataset-item">
                  <h4>{ds.nombre}</h4>
                  <p>{ds.descripcion}</p>
                </div>
              ))}
            </div>
          )}

        </div>

      </main>

    </div>
  );
}

export default InstitucionDetalle;