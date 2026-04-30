import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, Database, Building2, Newspaper, BookOpen } from "lucide-react";

import { getDatasets } from "../../Services/DatasetService";
import { getInstituciones } from "../../Services/InstitucionesService";
import { getPublications } from "../../Services/PublicacionesService";
import { getNoticias } from "../../Services/NoticiasService";

import "../../Styles/ComponentStyle/Home/SearchBar.css";

function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const fetchGlobalData = async () => {
      setLoading(true);
      setIsOpen(true);

      try {
        const [resDatos, resInst, resPubs, resNotis] = await Promise.all([
          getDatasets({ search: query, limit: 3 }).catch(() => ({ data: [] })),
          getInstituciones({ search: query, limit: 3 }).catch(() => ({ data: [] })),
          getPublications({ search: query, limit: 3 }).catch(() => ({ data: [] })),
          getNoticias({ search: query, limit: 3 }).catch(() => ({ data: [] }))
        ]);

        const formattedDatos = (resDatos.data || []).map(d => ({
          id: d.dataset_id || d.id,
          title: d.nombre || d.name || d.title || "Dataset sin nombre",
          description: d.descripcion || d.description || "Conjunto de datos público",
          type: "dataset",
          icon: <Database size={16} />,
          url: `/conjuntodatos/${d.dataset_id || d.id}` 
        }));

        const formattedInst = (resInst.data || []).map(i => ({
          id: i.institution_id || i.id,
          title: i.nombre || i.name || i.title || "Institución sin nombre",
          description: i.descripcion || i.description || "Institución u organismo gubernamental",
          type: "institución",
          icon: <Building2 size={16} />,
          url: `/instituciones/${i.institution_id || i.id}`
        }));

        const formattedPubs = (resPubs.data || []).map(p => ({
          id: p.id,
          title: p.title,
          description: p.summary || p.description || "Documento o análisis del observatorio",
          type: "publicación",
          icon: <BookOpen size={16} />,
          url: `/publicaciones/${p.slug || p.id}`
        }));

        const formattedNotis = (resNotis.data || []).map(n => ({
          id: n.id,
          title: n.title,
          description: n.summary || n.content || "Artículo de actualidad",
          type: "noticia",
          icon: <Newspaper size={16} />,
          url: `/noticias/${n.slug || n.id}`
        }));

        const allResults = [...formattedDatos, ...formattedInst, ...formattedPubs, ...formattedNotis];
        setResults(allResults.slice(0, 7));

      } catch (error) {
        console.error("Error en búsqueda global:", error);
      } finally {
        setLoading(false);
      }
    };

    const timerId = setTimeout(() => {
      fetchGlobalData();
    }, 300);

    return () => clearTimeout(timerId);
  }, [query]);

  const handleResultClick = (url) => {
    setIsOpen(false);
    setQuery("");
    navigate(url);
  };

  const handleKeyDown = (e) => {
    // Al no tener página de búsqueda global, si presionan "Enter" solo evitamos que se recargue la página.
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <div className="global-search-container" ref={dropdownRef}>
      <div className="global-search-input-wrapper">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          className="global-search-input"
          placeholder="Busca datos, instituciones, noticias..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0 || query.length >= 2) setIsOpen(true) }}
          onKeyDown={handleKeyDown}
        />
        {loading && <Loader2 className="loading-spinner" size={18} />}
      </div>

      {/* Menú Desplegable */}
      {isOpen && query.trim().length >= 2 && (
        <div className="global-search-dropdown fade-in">
          {loading && results.length === 0 ? (
            <div className="dropdown-message">Buscando en el sistema...</div>
          ) : results.length > 0 ? (
            <ul className="dropdown-list">
              {results.map((item, index) => (
                <li 
                  key={`${item.type}-${item.id}-${index}`} 
                  className="dropdown-item"
                  onClick={() => handleResultClick(item.url)}
                >
                  <span className={`item-icon type-${item.type}`}>
                    {item.icon}
                  </span>
                  
                  <div className="item-info">
                    <div className="item-header">
                      <span className="item-title">{item.title}</span>
                      <span className={`item-badge badge-${item.type}`}>{item.type}</span>
                    </div>
                    <span className="item-desc">{item.description}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="dropdown-list">
               <li className="dropdown-message">No se encontraron resultados para "{query}".</li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;