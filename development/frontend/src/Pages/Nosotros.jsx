import { useParams, Link } from "react-router-dom";
import { nosotrosPages } from "../data/NosotrosPage";
import "../styles/pages_styles/Nosotros.css";

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

        <p>{currentPage.content}</p>

      </section>

    </div>
  );
}

export default Nosotros;