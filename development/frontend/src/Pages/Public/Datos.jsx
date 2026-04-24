import { useState, useEffect } from "react";
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
        // 👇 Agregamos getOds() a la promesa
        const [categoriasData, tagsData, licenciasData, odsData] = await Promise.all([
          getCategorias(),
          getTags(),
          getLicencias(),
          getOds() // 👈 NUEVO
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

  return (
    <div className="datos-page">
      <Breadcrumb paths={["Inicio", "Datasets"]} />

      <div className="datos-layout">
        <aside className="datos-sidebar">
          {filtersLoading ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>Cargando filtros...</div>
          ) : (
            <AccordionFilter
              filters={filtersConfig}
              selectedFilters={filters}
              onChange={handleFilterChange}
              onClear={() => { setFilters({}); setPage(1); }}
            />
          )}
        </aside>

        <main className="datos-content">
          <SearchBarAdvanced
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />

          <div className="datos-header">
            <h1>Datasets</h1>
            <span>{totalResults} resultados</span>
          </div>

          {Object.keys(filters).length > 0 && (
            <div className="filters-chips">
              {Object.entries(filters).map(([key, values]) => (
                Array.isArray(values) && values.length > 0 && (
                  <button key={key} className="chip" onClick={() => removeFilter(key)}>
                    {/* Buscamos el label bonito para mostrar en el chip en lugar del ID */}
                    {key}: {values.length} seleccionados ✕
                  </button>
                )
              ))}
            </div>
          )}
    
          <hr className="datos-separator" />

          {loading ? (
            <div className="loading-state">Cargando datasets...</div>
          ) : data.length === 0 ? (
            <div className="empty-state">
              <h3>No se encontraron resultados</h3>
              <p>Intenta cambiar los filtros o búsqueda</p>
            </div>
          ) : (
            <div className="datasets-grid">
              {data.map((ds, index) => (
                <DatasetCard key={ds.id || ds.dataset_id || index} dataset={ds} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </main>
      </div>
    </div>
  );
}

export default Datos;