import { useState, useCallback } from "react";
import Papa from "papaparse";
import { mapColumns } from "../utils/columnMapper";

const INITIAL = {
  data: [],
  columns: [],
  mapping: null,
  metadata: null,
  loading: false,
  error: null,
};

export function useDataset() {
  const [state, setState] = useState(INITIAL);

  const loadDataset = useCallback(async (manifest) => {
    setState(s => ({ ...s, loading: true, error: null, data: [], columns: [], mapping: null, metadata: null }));

    try {
      const resp = await fetch(manifest.url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status} — no se pudo cargar el archivo.`);

      const text = await resp.text();
      const { data, meta, errors } = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });

      if (errors.length > 0 && data.length === 0) {
        throw new Error("El CSV no pudo procesarse: " + errors[0].message);
      }

      const columns = meta.fields ?? [];
      const mapping = mapColumns(columns, data);

      setState({
        data,
        columns,
        mapping,
        metadata: {
          name:        manifest.name,
          file:        manifest.file,
          format:      manifest.format,
          category:    manifest.category,
          description: manifest.description,
          ods:         manifest.ods,
          lastUpdated: manifest.lastUpdated,
          rows:        data.length,
          cols:        columns.length,
          sizeKb:      (text.length / 1024).toFixed(1),
        },
        loading: false,
        error: null,
      });
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: err.message ?? "Error desconocido." }));
    }
  }, []);

  const reset = useCallback(() => setState(INITIAL), []);

  return { ...state, loadDataset, reset };
}
