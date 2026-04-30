import { useState, useEffect } from "react";
import { useAuth } from "../../Context/AuthContext";
import { Tag, Plus, Trash2, Database, RotateCcw } from "lucide-react";
import "../../Styles/Pages_styles/Admin/MantenedorTags.css"; 

function MantenedorTags() {
  const { user } = useAuth();
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const fetchTags = async () => {
    const res = await fetch(`${API_URL}/api/tags`);
    if (res.ok) {
      const json = await res.json();
      setTags(json.data || []);
    }
  };

  useEffect(() => { fetchTags(); }, []);

  const handleEliminar = async (tag) => {
    let replacementId = null;
    if (tag.dataset_count > 0) {
      const confirmReplace = window.confirm(
        `Esta etiqueta tiene ${tag.dataset_count} datasets asociados.\n\n` +
        `Para eliminarla, debes elegir una etiqueta de reemplazo.\n` +
        `¿Deseas seleccionar una etiqueta existente? (Cancelar para crear una nueva)`
      );
      if (confirmReplace) {
        const otherTags = tags.filter(t => t.tag_id !== tag.tag_id);
        const options = otherTags.map((t, i) => `${i+1}. ${t.name}`).join('\n');
        const choice = window.prompt(`Selecciona el NÚMERO de la etiqueta de reemplazo:\n\n${options}`);
        if (choice && otherTags[parseInt(choice)-1]) {
          replacementId = otherTags[parseInt(choice)-1].tag_id;
        } else return;
      } else {
        const newName = window.prompt("Escribe el nombre de la NUEVA etiqueta que reemplazará a esta:");
        if (!newName) return;
        const resNew = await fetch(`${API_URL}/api/tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
          body: JSON.stringify({ name: newName })
        });
        const jsonNew = await resNew.json();
        replacementId = jsonNew.data.tag_id;
      }
    } else if (!window.confirm(`¿Seguro que quieres eliminar "${tag.name}"?`)) return;

    const url = `${API_URL}/api/tags/${tag.tag_id}${replacementId ? `?replacementId=${replacementId}` : ''}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${user.token}` }
    });
    if (res.ok) fetchTags();
  };

  return (
    <div className="gestion-datasets">
      <div className="header">
        <div className="header-info">
          <h1>Mantenedor de Etiquetas</h1>
          <p>Administra las etiquetas globales utilizadas para categorizar los conjuntos de datos.</p>
        </div>
      </div>

      {/* SECCIÓN DE CREACIÓN (Estilizada como filtros) */}
      <div className="filters-section">
        <form className="filters-grid tags-form-layout" onSubmit={async (e) => {
          e.preventDefault();
          const res = await fetch(`${API_URL}/api/tags`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
            body: JSON.stringify({ name: newTagName })
          });
          if (res.ok) { setNewTagName(""); fetchTags(); }
        }}>
          <div className="input-wrapper search-wrapper">
            <label>Nueva Etiqueta</label>
            <input 
              type="text" 
              value={newTagName} 
              onChange={e => setNewTagName(e.target.value)} 
              placeholder="Ej: Medio Ambiente, Salud..." 
              required 
            />
          </div>
          <div className="filter-actions">
            <button type="submit" className="btn-aplicar">
              <Plus size={18} /> CREAR ETIQUETA
            </button>
          </div>
        </form>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre de Etiqueta</th>
              <th style={{ textAlign: 'center' }}>Uso en Datasets</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.tag_id}>
                <td style={{ fontWeight: '600' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <Tag size={16} style={{ color: '#1a6bf0' }} />
                     {tag.name}
                   </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className="estado-badge archived">
                    {tag.dataset_count} Datasets
                  </span>
                </td>
                <td className="acciones">
                  <Trash2 
                    className="action-icon btn-destruir-icon" 
                    size={20} 
                    title="Eliminar Etiqueta"
                    onClick={() => handleEliminar(tag)} 
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MantenedorTags;