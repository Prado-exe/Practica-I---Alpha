import { useState, useEffect } from "react";
import { Database, Inbox, Loader2, X, FilterX } from "lucide-react"; // 👈 Nuevos íconos
import Breadcrumb from "../../Components/Common/Breadcrumb";
import Pagination from "../../Components/Common/Pagination";
import AccordionFilter from "../../Components/Common/AccordionFilter";
import DatasetCard from "../../Components/Cards/DatasetCard";
import SearchBarAdvanced from "../../Components/Common/SearchBarAdvanced";

import { useFetchList } from "../../Components/Hooks/useFetchList";
import { getDatasets } from "../../Services/DatasetService";

import { getCategorias, getOds } from "../../Services/CategoriaService";
import { getTags, getLicencias } from "../../Services/EtiquetaService";

import "../../Styles/Pages_styles/Public/Datos.css";

function Datos() {
  const {
    search, setSearch, filters, setFilters,
    page, setPage, data, totalPages, totalResults, loading
  } = useFetchList(getDatasets, { limit: 7 });

  const [filtersConfig, setFiltersConfig] = useState([]);
  const [filtersLoading, setFiltersLoading] = useState(true);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        setFiltersLoading(true);
        const [categoriasData, tagsData, licenciasData, odsData] = await Promise.all([
          getCategorias(),
          getTags(),
          getLicencias(),
          getOds() 
        ]);

        const dynamicFilters = [
          {
            key: "categoria",
            title: "Categoría",
            options: categoriasData.map(c => ({ label: c.name, value: String(c.category_id) })),
            defaultOpen: false
          },
          {
            key: "etiqueta",
            title: "Etiquetas",
            options: tagsData.map(t => ({ label: t.name, value: String(t.tag_id) }))
          },
          {
            key: "licencia",
            title: "Licencia",
            options: licenciasData.map(l => ({ label: l.name, value: String(l.license_id) }))
          },
          {
            key: "ods",
            title: "Objetivo ODS",
            options: odsData.map(o => ({ 
              label: `${o.objective_code} - ${o.name || o.objective_name}`, 
              value: String(o.ods_id || o.ods_objective_id) 
            }))
          }
        ];

        setFiltersConfig(dynamicFilters);
      } catch (error) {
        console.error("Error al cargar filtros:", error);
      } finally {
        setFiltersLoading(false);
      }
    };
    loadFilters();
  }, []);

  const handleFilterChange = (key, values) => {
    setFilters(prev => ({ ...prev, [key]: values }));
    setPage(1); 
  };

  const removeFilter = (key) => {
    setFilters(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    setPage(1); 
  };

  const clearAll = () => {
    setFilters({});
    setSearch("");
    setPage(1);
  };
  console.log("DATA LISTA:", data);
  return (
    <div className="datos-page">
      <Breadcrumb paths={["Inicio", "Datasets"]} />

      <div className="datos-layout">
        <aside className="datos-sidebar">
          <div className="sidebar-header">
            <h3>Filtros</h3>
            {Object.keys(filters).length > 0 && (
              <button className="btn-clear-filters-text" onClick={clearAll}>
                Limpiar
              </button>
            )}
          </div>
          
          {filtersLoading ? (
            <div className="sidebar-loading">
              <Loader2 className="spinner" size={24} />
              <span>Cargando filtros...</span>
            </div>
          ) : (
            <div className="accordion-container">
              <AccordionFilter
                filters={filtersConfig}
                selectedFilters={filters}
                onChange={handleFilterChange}
                onClear={() => { setFilters({}); setPage(1); }}
              />
            </div>
          )}
        </aside>

        <main className="datos-content">
          <SearchBarAdvanced
            placeholder="Buscar datasets..."
            onSearch={(query) => { 
              if (query !== search) {
                setSearch(query); 
                setPage(1); 
              }
            }}
          />

          <div className="datos-header">
            <div className="header-title">
              <Database className="header-icon" size={28} />
              <h1>Explorador de Datasets</h1>
            </div>
            <span className="results-badge">{totalResults} resultados</span>
          </div>
          
          {Object.keys(filters).length > 0 && (
            <div className="filters-chips">
              {Object.entries(filters).map(([key, values]) => (
                Array.isArray(values) && values.length > 0 && (
                  <button key={key} className="chip" onClick={() => removeFilter(key)}>
                    <span className="chip-key">{key}:</span> 
                    <span className="chip-val">{values.length} sel.</span>
                    <X size={14} className="chip-icon" />
                  </button>
                )
              ))}
            </div>
          )}
    
          <hr className="datos-separator" />

          {loading ? (
            <div className="loading-state">
              <Loader2 className="spinner-large" size={40} />
              <p>Buscando datasets...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrapper">
                <Inbox size={48} className="empty-icon" />
              </div>
              <h3>No se encontraron resultados</h3>
              <p>No hay datasets que coincidan con tus filtros o términos de búsqueda.</p>
              <button className="btn-empty-clear" onClick={clearAll}>
                <FilterX size={18} />
                Limpiar filtros y búsqueda
              </button>
            </div>
          ) : (
            <div className="datasets-grid fade-in">
              {data.map((ds, index) => (
                <DatasetCard key={ds.id || ds.dataset_id || index} dataset={ds} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination-wrapper">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Datos;