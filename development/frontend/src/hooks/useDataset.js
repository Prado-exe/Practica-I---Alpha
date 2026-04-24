import { useState, useCallback } from "react";
import Papa from "papaparse";
import { mapColumns } from "../utils/columnMapper";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const INITIAL = {
  data: [], columns: [], mapping: null, metadata: null, loading: false, error: null,
};

export function useDataset() {
  const [state, setState] = useState(INITIAL);

  // Carga el contenido de un archivo específico una vez que el usuario lo selecciona
  const loadFileContent = useCallback(async (file, datasetMeta) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      if (!file.file_url) throw new Error("El archivo seleccionado no tiene una URL válida.");

      const fileRes = await fetch(file.file_url);
      if (!fileRes.ok) throw new Error("Error al descargar el archivo del servidor.");

      const text = await fileRes.text();
      const { data, meta, errors } = Papa.parse(text, {
        header: true, skipEmptyLines: true, dynamicTyping: true,
      });

      if (errors.length > 0 && data.length === 0) {
        throw new Error("El archivo no pudo procesarse: " + errors[0].message);
      }

      const columns = meta.fields ?? [];
      const mapping = mapColumns(columns, data);

      setState({
        data, columns, mapping,
        metadata: {
          name:        datasetMeta.title,
          file:        file.display_name,
          format:      file.file_format,
          category:    datasetMeta.category_name || "Sin categoría",
          description: datasetMeta.description,
          // ods:      datasetMeta.ods_objective_id ? [`ODS ${datasetMeta.ods_objective_id}`] : [],
          lastUpdated: new Date(datasetMeta.updated_at || datasetMeta.created_at).toLocaleDateString("es-CL"),
          rows:        data.length,
          cols:        columns.length,
          sizeKb:      (file.file_size_bytes / 1024).toFixed(1),
        },
        loading: false, error: null,
      });
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: err.message ?? "Error al procesar el archivo." }));
    }
  }, []);

  const reset = useCallback(() => setState(INITIAL), []);

  return { ...state, loadFileContent, reset };
}