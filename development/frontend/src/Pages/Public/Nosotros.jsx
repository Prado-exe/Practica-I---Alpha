import { useParams, Link } from "react-router-dom";
import { nosotrosPages } from "../../data/NosotrosPage";
import "../../Styles/Pages_styles/Public/Nosotros.css";

function Nosotros() {
  const { section } = useParams();
  const currentPage = nosotrosPages.find(p => p.id === section) || nosotrosPages[0];

  return (
    <div className="nosotros-container">
      {/* MENÚ IZQUIERDO */}
      <aside className="nosotros-menu">
        <h3>Sobre Nosotros</h3>
        <ul>
          {nosotrosPages.map(page => (
            <li key={page.id} className={section === page.id ? "active" : ""}>
              <Link to={`/nosotros/${page.id}`}>{page.title}</Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* CONTENIDO DERECHO */}
      <section className="nosotros-content">
        <h1>{currentPage.title}</h1>
        <div className="separator"></div>

        <div className="content-body">
          {Array.isArray(currentPage.content) && currentPage.content.map((item, index) => {
            // Render de Texto
            if (item.type === "text") {
              return <p key={index} className="text-paragraph">{item.value}</p>;
            }

            // Render de Imágenes Simples
            if (item.type === "image") {
              return <img key={index} src={item.value} alt={item.alt} className="content-image" />;
            }

            // Render de Tablas
            if (item.type === "table") {
              return (
                <div className="table-container" key={index}>
                  <table className="nosotros-table">
                    <thead>
                      <tr>{item.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {item.rows.map((row, rIdx) => (
                        <tr key={rIdx}>{row.map((cell, cIdx) => <td key={cIdx}>{cell}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }

            // BLOQUE CRÍTICO: Render del Equipo en Tarjetas
            if (item.type === "grid-equipo") {
              return (
                <div className="equipo-grid" key={index}>
                  {item.members.map((member, mIdx) => (
                    <div className="member-card" key={mIdx}>
                      <div className="member-image-container">
                        <img 
                          src={member.image} 
                          alt={member.name} 
                          className="member-photo" 
                          onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }} 
                        />
                      </div>
                      <h4 className="member-name">{member.name}</h4>
                      <p className="member-role">{member.role}</p>
                    </div>
                  ))}
                </div>
              );
            }
            return null;
          })}
        </div>
      </section>
    </div>
  );
}

export default Nosotros;