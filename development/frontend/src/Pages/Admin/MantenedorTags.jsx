import { useState, useEffect } from "react";
import { useAuth } from "../../Context/AuthContext";

function MantenedorTags() {
  const { user } = useAuth();
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || "http://3.139.202.192:3000";

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
        // Crear la nueva etiqueta primero
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
      <h1>Mantenedor de Etiquetas</h1>
      
      <form onSubmit={async (e) => {
        e.preventDefault();
        const res = await fetch(`${API_URL}/api/tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
          body: JSON.stringify({ name: newTagName })
        });
        if (res.ok) { setNewTagName(""); fetchTags(); }
      }}>
        <input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="Nueva etiqueta..." required />
        <button type="submit" className="btn-create">Crear</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Datasets Asociados</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tags.map(tag => (
            <tr key={tag.tag_id}>
              <td>{tag.name}</td>
              <td style={{textAlign: 'center'}}>{tag.dataset_count}</td>
              <td>
                <button className="btn-delete" onClick={() => handleEliminar(tag)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MantenedorTags;