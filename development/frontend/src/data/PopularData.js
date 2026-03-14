import carabineros from "../assets/carabineros_logo.png";
import inapi from "../assets/inapi_logo.jpg";
import mineria from "../assets/Min_mineria.png";
import odepa from "../assets/odepa_logo.jpg";
import rectoria from "../assets/rectoria_logo.png";
import sisib from "../assets/Sisib_logo.png";

export const popularData = [
  {
    id: 1,
    title: "Precios al consumidor",
    description:
      "Conjuntos de datos de precios al consumidor de los principales alimentos de la canasta familiar.",
    category: "Economía",
    image: odepa,
  },
  {
    id: 2,
    title: "Consumo y uso de agua en minería",
    description:
      "Tablas de datos relacionados con el consumo de agua por parte de las empresas mineras desde el año 2009.",
    category: "Minería",
    image: mineria,
  },
  {
    id: 3,
    title: "Registros de patentes",
    description:
      "Registros de patentes a nivel nacional desde el año 2002.",
    category: "Innovación",
    image: inapi,
  },
  {
    id: 4,
    title: "Cuadro estadístico de llamadas 133",
    description:
      "Cuadro estadístico de llamadas al nivel 133 de Carabineros de Chile durante el año 2012.",
    category: "Seguridad",
    image: carabineros,
  },
  {
    id: 5,
    title: "Recaudación total ingresos privados",
    description:
      "Recaudación obtenida por el pago de servicios solicitados por usuarios del DDI entre los años 2011 y 2012.",
    category: "Finanzas",
    image: sisib,
  },
  {
    id: 6,
    title: "Matrícula total de doctorado CRUCH",
    description:
      "Información estadística de las matrículas totales de doctorado generada por universidades miembros.",
    category: "Educación",
    image: rectoria,
  },
];