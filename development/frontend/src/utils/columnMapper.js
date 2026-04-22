/* =================================================================
   MAPEO DINÁMICO POR PERFILADO DE DATOS (DATA PROFILING)
   No depende de nombres de columnas, analiza el contenido real.
   ================================================================= */

// Limpia símbolos de moneda ($), comas y espacios para detectar números reales
function parseNumeric(val) {
  if (val == null || val === "") return NaN;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/[^0-9.-]+/g, "");
  // Evitamos que un string vacío o un solo guión pase como número
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return NaN;
  return Number(cleaned);
}

// Detecta fechas comunes (YYYY, YYYY-MM-DD, DD/MM/YYYY)
function isDate(val) {
  if (!val) return false;
  const s = String(val).trim();
  // Año simple (ej. 2020 a 2030)
  if (/^20[0-3]\d$/.test(s)) return true;
  // Formatos con guiones o slashes
  return /^(19|20)\d{2}[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12][0-9]|3[01])$/.test(s) || 
         /^(0[1-9]|[12][0-9]|3[01])[-/](0[1-9]|1[0-2])[-/](19|20)\d{2}$/.test(s);
}

export function mapColumns(columns, data) {
  // 1. Tomamos una muestra grande (hasta 100 filas) para analizar estadísticamente
  const sampleSize = Math.min(100, data.length);
  const sample = data.slice(0, sampleSize);
  const typeMap = {};

  // 2. Analizamos cada columna de forma independiente
  for (const col of columns) {
    let numCount = 0;
    let dateCount = 0;
    let validCount = 0;
    const uniqueValues = new Set();

    // Recorremos la muestra recopilando estadísticas
    for (const row of sample) {
      const val = row[col];
      if (val !== null && val !== undefined && val !== "") {
        validCount++;
        uniqueValues.add(val);

        if (!isNaN(parseNumeric(val))) numCount++;
        if (isDate(val)) dateCount++;
      }
    }

    // Si la columna está vacía en la muestra, la ignoramos
    if (validCount === 0) {
      typeMap[col] = "unknown";
      continue;
    }

    // 3. Calculamos los ratios (porcentajes)
    const numRatio = numCount / validCount;
    const dateRatio = dateCount / validCount;
    // Cardinalidad: ¿Qué tan únicos son los datos? (0.0 = todos repetidos, 1.0 = todos distintos)
    const uniqueRatio = uniqueValues.size / validCount;

    /* --- MOTOR DE DECISIÓN DINÁMICA --- */
    
    if (dateRatio > 0.5) {
      // Si más de la mitad parecen fechas o años
      typeMap[col] = "time";
    } 
    else if (numRatio > 0.7) {
      // Si el 70% son números. (Descartamos si es un ID donde el 100% son únicos)
      if (uniqueRatio > 0.98 && validCount > 20) {
        typeMap[col] = "unknown"; // Es un ID numérico, no sirve para sumar
      } else {
        typeMap[col] = "numeric";
      }
    } 
    else if (uniqueValues.size <= Math.min(30, validCount * 0.5)) {
      // Si hay pocos valores únicos repetidos muchas veces (ej. "Hombre", "Mujer", "Aprobado")
      typeMap[col] = "category";
    } 
    else {
      // Si es puro texto único (como descripciones largas o nombres propios)
      typeMap[col] = "unknown";
    }
  }

  // 4. Seleccionamos las mejores columnas para el Dashboard
  const numericCols  = columns.filter(c => typeMap[c] === "numeric");
  const categoryCols = columns.filter(c => typeMap[c] === "category");

  const timeCol      = columns.find(c => typeMap[c] === "time") ?? null;
  // La región es la única que buscamos por nombre dentro de las categorías, porque es difícil adivinarla por contenido
  const regionCol    = categoryCols.find(c => /region|comuna|provincia|ciudad/i.test(c)) ?? null;
  
  let primaryNumericCol = numericCols[0] ?? null;
  let categoryCol       = categoryCols[0] ?? null;

  /* --- SISTEMA DE EMERGENCIA (FALLBACKS) --- */
  // Si el perfilado fue muy estricto y no detectó categorías, forzamos la primera de texto
  if (!categoryCol) {
    categoryCol = columns.find(c => typeMap[c] === "unknown") ?? columns[0];
  }
  // Si no detectó números (muy raro con este algoritmo), forzamos una
  if (!primaryNumericCol && columns.length > 1) {
    const backupNum = columns.find(c => c !== categoryCol && c !== timeCol);
    if (backupNum) primaryNumericCol = backupNum;
  }

  return {
    all: typeMap,
    regionCol,
    timeCol,
    variationCol: null, // Dejamos la variación libre (suele requerir lógica de negocio específica)
    categoryCol,
    numericCols,
    primaryNumericCol,
    confidence: (primaryNumericCol && categoryCol) ? 1 : 0.5,
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