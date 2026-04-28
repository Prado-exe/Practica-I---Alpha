import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPublications } from "../../Services/PublicacionesService";
import { getNoticias } from "../../Services/NoticiasService"; 
import { Loader2, Newspaper, BookOpen, Calendar, ArrowRight, ExternalLink } from "lucide-react";
import "../../Styles/ComponentStyle/Home/LastPost.css";

function LastPost() {
  const [contenidos, setContenidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUltimosContenidos = async () => {
      try {
        setLoading(true);
        const [pubResponse, notResponse] = await Promise.all([
          getPublications({ limit: 3 }),
          getNoticias({ limit: 3 })
        ]);
        
        const publicaciones = (pubResponse.data || pubResponse || []).map(item => ({
          ...item,
          tipo: 'publicacion'
        }));
        
        const noticias = (notResponse.data || notResponse || []).map(item => ({
          ...item,
          tipo: 'noticia'
        }));

        const todosLosContenidos = [...publicaciones, ...noticias];

        todosLosContenidos.sort((a, b) => {
          const fechaA = new Date(a.date || a.created_at || a.published_at || 0);
          const fechaB = new Date(b.date || b.created_at || b.published_at || 0);
          return fechaB - fechaA; 
        });

        setContenidos(todosLosContenidos.slice(0, 3));
      } catch (error) {
        console.error("Error al obtener los últimos contenidos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUltimosContenidos();
  }, []);

  return (
    <section className="lastpost-wrapper">
      <div className="lastpost-inner">
        
        {/* HEADER ESTILO EDITORIAL */}
        <div className="lastpost-header">
          <div className="lastpost-title-box">
            <span className="lastpost-subtitle">Actualidad</span>
            <h2>Novedades del Observatorio</h2>
            <div className="lastpost-accent-line"></div>
          </div>
          <button className="lastpost-btn-all" onClick={() => navigate('/noticias')}>
            Ver todo el contenido <ArrowRight size={18} />
          </button>
        </div>

        {loading ? (
          <div className="lastpost-loading">
            <Loader2 className="animate-spin" size={40} />
            <p>Sincronizando últimas publicaciones...</p>
          </div>
        ) : (
          <div className="lastpost-list">
            {contenidos.map((item) => {
              const isNoticia = item.tipo === 'noticia';
              const rutaDestino = isNoticia 
                ? `/noticias/${item.slug || item.id}` 
                : `/publicaciones/${item.slug || item.id}`;

              return (
                <article key={`${item.tipo}-${item.id}`} className="lastpost-card">
                  {/* Barra lateral de color para consistencia con PopularData */}
                  <div className="card-type-strip"></div>
                  
                  <div className="lastpost-card-content">
                    <div className="lastpost-img-box">
                      <img 
                        src={item.image || item.cover_image || item.image_url || "/img/default-publication.jpg"} 
                        alt={item.title} 
                        onError={(e) => { 
                          e.target.onerror = null; 
                          e.target.src = "/img/default-publication.jpg"; 
                        }}
                      />
                    </div>

                    <div className="lastpost-info">
                      <div className="lastpost-top-meta">
                        <span className={`lastpost-badge-pill ${item.tipo}`}>
                          {isNoticia ? <Newspaper size={14} /> : <BookOpen size={14} />}
                          {isNoticia ? 'Noticia' : 'Publicación'}
                        </span>
                        <span className="lastpost-date">
                          <Calendar size={14} />
                          {new Date(item.date || item.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </div>

                      <h3 title={item.title}>{item.title}</h3>
                      
                      <p className="lastpost-description">
                        {item.summary || item.description || "Explora los detalles técnicos y narrativos de esta reciente actualización del observatorio."}
                      </p>

                      <div className="lastpost-footer">
                        <span className="lastpost-category">
                          {item.category_name || item.category || "General"}
                        </span>
                        <button onClick={() => navigate(rutaDestino)} className="lastpost-action-btn">
                          {isNoticia ? 'Leer Artículo' : 'Ver Documento'}
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default LastPost;