// src/Pages/Public/PublicacionDetalle.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, FileText, ChevronLeft, Loader2 } from "lucide-react";
import { getPublicationBySlug } from "../../Services/PublicacionesService";
import Breadcrumb from "../../Components/Common/Breadcrumb";
import "../../Styles/Pages_styles/Public/NoticiaDetalle.css"; // Reutilizamos estilos

function PublicacionDetalle() {
  const { slug } = useParams();
  const [pub, setPub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    getPublicationBySlug(slug).then(data => {
      setPub(data);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return (
    <div className="noticia-detalle-page loading-center">
      <Loader2 className="spin" size={40} />
      <p>Cargando publicación...</p>
    </div>
  );

  if (!pub) return (
    <div className="noticia-detalle-page error-center">
      <h2>Publicación no encontrada</h2>
      <Link to="/publicaciones">Volver al listado</Link>
    </div>
  );

  return (
    <main className="noticia-detalle-page">
      <Breadcrumb paths={["Inicio", "Publicaciones", pub.title]} />
      
      <article className="noticia-article">
        <header className="article-header">
          <Link to="/publicaciones" className="back-link"><ChevronLeft size={18} /> Volver</Link>
          <h1 className="article-title">{pub.title}</h1>
          <div className="article-meta">
            <span><Calendar size={16} /> {new Date(pub.date).toLocaleDateString()}</span>
            <span><FileText size={16} /> {pub.type}</span>
          </div>
        </header>

        <div className="article-cover-container">
          <img src={pub.cover} alt={pub.title} className="article-cover-image" />
        </div>

        <div className="article-content">
          <div className="content-text">{pub.content}</div>
        </div>

        {pub.gallery && pub.gallery.length > 0 && (
          <section className="article-gallery">
            <hr className="gallery-divider" />
            <h3>Anexos e Imágenes</h3>
            <div className="gallery-grid">
              {pub.gallery.map((img, idx) => (
                <div key={idx} className="gallery-item">
                  <img src={img} alt={`Adjunto ${idx + 1}`} loading="lazy" />
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}

export default PublicacionDetalle;