import { useState, useCallback } from "react";
import Papa from "papaparse";
import { mapColumns } from "../utils/columnMapper";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const INITIAL = {
  data: [], columns: [], mapping: null, metadata: null, loading: false, error: null,
};

export function useDataset() {
  const [state, setState] = useState(INITIAL);

  const loadDataset = useCallback(async (manifest) => {
    setState(s => ({ ...s, loading: true, error: null, data: [], columns: [], mapping: null, metadata: null }));

    try {
      if (!manifest.url) throw new Error("La URL del archivo CSV está vacía.");

      console.log(`🚀 [RAYOS X] Iniciando descarga desde: ${manifest.url}`);
      
      const resp = await fetch(manifest.url);
      
      if (!resp.ok) {
        throw new Error(`Error de red HTTP ${resp.status}: No se pudo acceder al archivo en MinIO.`);
      }

      // 1. OBTENEMOS EL TEXTO CRUDO
      const text = await resp.text();
      
      // 2. IMPRIMIMOS LO QUE LLEGÓ PARA VER EL ERROR REAL
      console.log("📦 [RAYOS X] Contenido real descargado (Primeros 300 caracteres):");
      console.log(text.substring(0, 300));

      // 3. DETECTORES DE ERRORES SILENCIOSOS
      if (text.trim().startsWith("<?xml") || text.trim().includes("<Error>")) {
        throw new Error("MinIO bloqueó la descarga. Está devolviendo un error XML. Verifica que el Bucket sea PÚBLICO y que la ruta sea correcta.");
      }
      
      if (text.trim().startsWith("<!DOCTYPE html>") || text.trim().startsWith("<html")) {
        throw new Error("El servidor devolvió una página web (HTML) en lugar de un CSV. La ruta del archivo está mal armada.");
      }

      if (text.trim() === "") {
        throw new Error("El archivo se descargó, pero está completamente en blanco.");
      }

      // 4. PROCESAMIENTO NORMAL CON PAPA PARSE
      const { data, meta, errors } = Papa.parse(text, {
        header: true, skipEmptyLines: true, dynamicTyping: true,
      });

      if (errors.length > 0 && data.length === 0) {
        throw new Error("El archivo no pudo procesarse: " + errors[0].message);
      }

      const columns = meta.fields ?? [];
      
      if (columns.length === 0) {
         throw new Error("No se detectaron columnas. Asegúrate de que el archivo descargado realmente sea un CSV separado por comas.");
      }

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
      console.error("❌ [RAYOS X] El hook falló:", err);
      setState({
        ...INITIAL, // Reseteamos todo a valores vacíos
        loading: false, 
        error: err.message ?? "Error desconocido." 
      });
    }
  }, []);

  const reset = useCallback(() => setState(INITIAL), []);

  return { ...state, loadFileContent, reset };
}