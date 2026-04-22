const REGION_HINTS    = ["region", "area", "zona", "provincia", "localidad", "territorio", "servicio"];
const TIME_HINTS      = ["periodo", "fecha", "date", "año", "anio", "year", "mes", "month", "trimestre", "semestre"];
const VARIATION_HINTS = ["variacion", "variation", "cambio", "diferencia", "tendencia", "pct"];
const CATEGORY_HINTS  = ["indicador", "tipo", "categoria", "dependencia", "parametro", "modo", "nivel", "estado", "establecimiento", "nombre", "estacion"];
const NUMERIC_HINTS   = ["valor", "value", "total", "cantidad", "count", "monto", "pasajeros", "promedio", "maximo", "minimo", "km", "porcentaje"];

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "_");
}

function guessTypeByName(col) {
  const n = normalize(col);
  if (REGION_HINTS.some(h => n.includes(h)))    return "region";
  if (TIME_HINTS.some(h => n.includes(h)))       return "time";
  if (VARIATION_HINTS.some(h => n.includes(h)))  return "variation";
  if (CATEGORY_HINTS.some(h => n.includes(h)))   return "category";
  if (NUMERIC_HINTS.some(h => n.includes(h)))    return "numeric";
  return null;
}

function guessTypeByValues(values) {
  const nonNull = values.filter(v => v !== null && v !== "");
  if (nonNull.length === 0) return "unknown";

  const numericCount = nonNull.filter(v => !isNaN(Number(v))).length;
  if (numericCount / nonNull.length > 0.85) return "numeric";

  const uniqueCount = new Set(nonNull.map(String)).size;
  if (uniqueCount <= Math.min(20, nonNull.length * 0.4)) return "category";

  return "unknown";
}

export function mapColumns(columns, data) {
  const sample = data.slice(0, Math.min(30, data.length));
  const typeMap = {};

  for (const col of columns) {
    const byName   = guessTypeByName(col);
    const byValues = guessTypeByValues(sample.map(r => r[col]));
    typeMap[col] = byName ?? byValues;
  }

  const regionCol    = columns.find(c => typeMap[c] === "region")    ?? null;
  const timeCol      = columns.find(c => typeMap[c] === "time")      ?? null;
  const variationCol = columns.find(c => typeMap[c] === "variation") ?? null;
  const categoryCol  = columns.find(c => typeMap[c] === "category")  ?? null;
  const numericCols  = columns.filter(c => typeMap[c] === "numeric");
  const primaryNumericCol = numericCols[0] ?? null;

  const confidence = [regionCol, primaryNumericCol].filter(Boolean).length / 2;

  return {
    all: typeMap,
    regionCol,
    timeCol,
    variationCol,
    categoryCol,
    numericCols,
    primaryNumericCol,
    confidence,
  };
}

export const TYPE_LABELS = {
  region:    { label: "Dimensión regional",  emoji: "📍" },
  time:      { label: "Dimensión temporal",  emoji: "📅" },
  variation: { label: "Variación / tendencia", emoji: "📈" },
  category:  { label: "Categoría",           emoji: "🏷️" },
  numeric:   { label: "Métrica",             emoji: "📊" },
  unknown:   { label: "Sin clasificar",      emoji: "❓" },
};
