import { useParams, Link } from "react-router-dom";
import { nosotrosPages } from "../../data/NosotrosPage";
import "../../Styles/Pages_styles/Public/Nosotros.css"
function Nosotros() {
  const { section } = useParams();

  const currentPage =
    nosotrosPages.find(p => p.id === section) || nosotrosPages[0];

  return (
    <div className="nosotros-container">
      {/* MENU IZQUIERDO */}
      <aside className="nosotros-menu">
        <h3>Sobre Nosotros</h3>
        <ul>
          {nosotrosPages.map(page => (
            <li
              key={page.id}
              className={section === page.id ? "active" : ""}
            >
              <Link to={`/nosotros/${page.id}`}>
                {page.title}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* CONTENIDO DERECHO */}
      <section className="nosotros-content">
        <h1>{currentPage.title}</h1>
        <div className="separator"></div>

        {/* --- CAMBIO AQUÍ: Renderizado dinámico --- */}
        <div className="content-body">
          {Array.isArray(currentPage.content) ? (
            currentPage.content.map((item, index) => {
              if (item.type === "text") {
                return (
                  <p key={index} className="text-paragraph">
                    {item.value}
                  </p>
                );
              }
              if (item.type === "image") {
                return (
                  <img 
                    key={index} 
                    src={item.value} 
                    alt={item.alt} 
                    className="content-image" 
                  />
                );
              }
              {/* ... dentro del map de currentPage.content ... */}

              if (item.type === "table") {
                return (
                  <div className="table-container" key={index}>
                    <table className="nosotros-table">
                      <thead>
                        <tr>
                          {item.headers.map((h, i) => <th key={i}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {item.rows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }
              return null;
            })
          ) : (
            // Por si alguna página aún tiene solo texto plano
            <p className="text-paragraph">{currentPage.content}</p>
          )}
        </div>
        {/* --- FIN DEL CAMBIO --- */}

      </section>
    </div>
  );
}

export default Nosotros;