export const publicaciones = [
  {
    id: 1,
    title: "Estudio sobre inteligencia artificial aplicada al sector público",
    description:
      "Investigación que analiza el uso de inteligencia artificial para mejorar la eficiencia de servicios gubernamentales.",
    type: "Artículo",
    author: "Dr. Juan Pérez",
    date: "2025-01-10",
    file: "#",
    tags: ["IA", "Gobierno"]
  },
  {
    id: 2,
    title: "Informe sobre desarrollo sostenible en regiones del norte",
    description:
      "Reporte que examina indicadores de sostenibilidad ambiental y económica en zonas áridas.",
    type: "Informe",
    author: "Centro de Estudios Regionales",
    date: "2025-02-02",
    file: "#",
    tags: ["ODS", "Medio Ambiente"]
  },
  {
    id: 3,
    title: "Análisis del impacto de datos abiertos en políticas públicas",
    description:
      "Documento académico que revisa el rol de los datos abiertos en la transparencia y toma de decisiones.",
    type: "Estudio",
    author: "Observatorio de Datos",
    date: "2025-02-18",
    file: "#",
    tags: ["Datos abiertos", "Transparencia"]
  }
];

/* GENERAR MUCHAS PUBLICACIONES */

const types = ["Artículo", "Informe", "Estudio"];

const authors = [
  "Dr. Juan Pérez",
  "Dra. María González",
  "Centro de Estudios Regionales",
  "Instituto de Datos Públicos",
  "Observatorio Social"
];

const tagsPool = [
  ["Tecnología", "Innovación"],
  ["Políticas públicas", "Gobierno"],
  ["Sostenibilidad", "ODS"],
  ["Educación", "Investigación"],
  ["Datos abiertos", "Transparencia"]
];

for (let i = 4; i <= 45; i++) {

  publicaciones.push({

    id: i,

    title: `Publicación académica ${i}`,

    description:
      "Documento académico de ejemplo que permite probar funcionalidades de filtrado, búsqueda y paginación dentro del portal.",

    type: types[i % types.length],

    author: authors[i % authors.length],

    date: `2025-03-${(i % 28) + 1}`,

    file: "#",

    tags: tagsPool[i % tagsPool.length]

  });

}