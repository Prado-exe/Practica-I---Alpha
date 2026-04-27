import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPublications } from "../../Services/PublicacionesService";
import { getNoticias } from "../../Services/NoticiasService"; 
import { Loader2 } from "lucide-react";
import "../../Styles/ComponentStyle/Home/LastPost.css";

function LastPost() {
  const [contenidos, setContenidos] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <section className="ultpublic-wrapper">
      <div className="ultpublic-container">
        
        <div className="ultpublic-header">
          <h2>Últimas actualizaciones</h2>
          <p>
            Revise los artículos, noticias y análisis más recientes publicados en el
            observatorio.
          </p>
          <hr className="ultpublic-separator" />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 className="animate-spin" size={40} color="#1565c0" />
          </div>
        ) : (
          <div className="ultpublic-grid">
            {contenidos.map((item) => {
              const rutaDestino = item.tipo === 'noticia' 
                ? `/noticias/${item.slug || item.id}` 
                : `/publicaciones/${item.slug || item.id}`;

              return (
                <article key={`${item.tipo}-${item.id}`} className="ultpublic-card">
                  
                  <div className="ultpublic-image-container">
                    {/* CORRECCIÓN AQUÍ: 
                      1. Usamos item.image como prioridad (igual que en PublicationCard).
                      2. Agregamos el onError con la misma imagen por defecto.
                    */}
                    <img 
                      src={item.image || item.cover_image || item.image_url} 
                      alt={item.title} 
                      onError={(e) => { 
                        e.target.onerror = null; 
                        e.target.src = "/img/default-publication.jpg"; 
                      }}
                    />
                  </div>

                  <div className="ultpublic-card-content">
                    <span className="ultpublic-category">
                      {item.category_name || item.type || item.category || (item.tipo === 'noticia' ? 'Noticia' : 'Publicación')}
                    </span>

                    <h3>{item.title}</h3>

                    <p>{item.summary || item.description}</p>

                    <Link 
                      to={rutaDestino} 
                      className="ultpublic-card-button"
                      style={{ textDecoration: 'none', textAlign: 'center', display: 'inline-block' }}
                    >
                      {item.tipo === 'noticia' ? 'Leer noticia' : 'Leer más'}
                    </Link>

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