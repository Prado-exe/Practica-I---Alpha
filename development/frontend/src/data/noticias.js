export const noticias = [
  {
    id: 1,
    title: "Avances en inteligencia artificial en Chile",
    description:
      "Nuevos centros de investigación buscan posicionar al país como líder regional en desarrollo de inteligencia artificial.",
    category: "Tecnología",
    date: "2025-01-15",
    image: "https://picsum.photos/400/250?1",
    tags: ["IA", "Innovación"]
  },
  {
    id: 2,
    title: "Programa social mejora acceso a vivienda",
    description:
      "Una nueva iniciativa estatal busca facilitar el acceso a viviendas dignas para familias de bajos ingresos.",
    category: "Sociedad",
    date: "2025-02-03",
    image: "https://picsum.photos/400/250?2",
    tags: ["Vivienda", "Gobierno"]
  },
  {
    id: 3,
    title: "Proyecto de reforestación en el norte",
    description:
      "Organizaciones ambientales impulsan un plan para recuperar ecosistemas degradados en zonas áridas.",
    category: "Medio Ambiente",
    date: "2025-02-20",
    image: "https://picsum.photos/400/250?3",
    tags: ["Naturaleza", "Sustentabilidad"]
  }


];

for (let i = 4; i <= 40; i++) {
  noticias.push({
    id: i,
    title: `Noticia de prueba ${i}`,
    description:
      "Contenido de ejemplo para simular noticias dentro del sistema. Permite probar filtros, búsqueda y paginación.",
    category: ["Tecnología", "Sociedad", "Medio Ambiente"][i % 3],
    date: `2025-03-${(i % 28) + 1}`,
    image: `https://picsum.photos/400/250?random=${i}`,
    tags: ["Datos", "Test"]
  });
}