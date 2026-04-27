import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, Tag, ChevronLeft, Loader2 } from "lucide-react";
import { getNoticiaBySlug } from "../../Services/NoticiasService";
import Breadcrumb from "../../Components/Common/Breadcrumb";
import "../../Styles/Pages_styles/Public/NoticiaDetalle.css";

function NoticiaDetalle() {
  const { slug } = useParams();
  const [noticia, setNoticia] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subimos el scroll al inicio al cargar la página
    window.scrollTo(0, 0);
    
    getNoticiaBySlug(slug).then(data => {
      setNoticia(data);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="noticia-detalle-page loading-center">
        <Loader2 className="spin" size={40} color="#0056b3" />
        <p>Cargando noticia...</p>
      </div>
    );
  }

  if (!noticia) {
    return (
      <div className="noticia-detalle-page error-center">
        <h2>No pudimos encontrar esta noticia.</h2>
        <p>Es posible que haya sido eliminada o que el enlace sea incorrecto.</p>
        <Link to="/noticias" className="btn-primary">Volver al listado</Link>
      </div>
    );
  }

  return (
    <main className="noticia-detalle-page">
      <Breadcrumb paths={["Inicio", "Noticias", noticia.title]} />
      
      <article className="noticia-article">
        <header className="article-header">
          <Link to="/noticias" className="back-link">
            <ChevronLeft size={18} /> Volver a noticias
          </Link>
          <h1 className="article-title">{noticia.title}</h1>
          
          <div className="article-meta">
            <span className="meta-item">
              <Calendar size={16} /> 
              {new Date(noticia.date).toLocaleDateString('es-CL')}
            </span>
            <span className="meta-item meta-category">
              <Tag size={16} /> 
              {noticia.category || "General"}
            </span>
          </div>
        </header>

        <div className="article-cover-container">
          <img src={noticia.cover} alt={noticia.title} className="article-cover-image" />
        </div>

        <div className="article-content">
          {/* El CSS se encargará de mantener los saltos de línea */}
          <div className="content-text">{noticia.content}</div>
        </div>

        {/* Galería Fotográfica: Solo se renderiza si hay imágenes extra */}
        {noticia.gallery && noticia.gallery.length > 0 && (
          <section className="article-gallery">
            <hr className="gallery-divider" />
            <h3>Galería de imágenes</h3>
            <div className="gallery-grid">
              {noticia.gallery.map((imgUrl, idx) => (
                <div key={idx} className="gallery-item">
                  <img src={imgUrl} alt={`Fotografía ${idx + 1}`} loading="lazy" />
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}

export default NoticiaDetalle;