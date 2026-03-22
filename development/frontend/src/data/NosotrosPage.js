import imagen1 from "../assets/nosotrosv1.png"
import imagen2 from "../assets/nosotros.png"

export const nosotrosPages = [
  {
    id: "quienes-somos",
    title: "Quiénes somos",
     content: [
    { type: "text", value: `El Observatorio de Datos Sostenibles es una plataforma digital orientada a facilitar el acceso,\
                            analisis y difusion de datos abiertos, relacionados con el desarrollo sostenible, el territorio y\
                            la toma de desiciones informadas. Su proposito es consolidad informacion proveniente de fuentes publicas,\
                            academicas e institucionales, transformandola en un recurso util para la comunidad universitaria, organismos \
                            publicos, investigadores y ciudadania general

                            El observatorio nace como una iniciativa academica vinculada a la universidad de La Serena, con el objetivo de \
                            fortalecer la cultura de los datos abiertos, promover la transparencia y apoyar el uso estrategico de la informacion\
                            para el desarrollo social, economico y ambiental. A travez de este portal, se busca centralizar conjuntos de datos, indicadores\
                            publicaciones y analisis que permitan comprender mejor los desafios actuales y futuros del territorio.
                            
                            El portal esta otiendado a:
                            \n 1. Facilitar el acceso a datos confiables y actualizados, promoviendo su reutilizacion en proyectos academicos, investigaciones, \
                            politicas publicas y procesos de innovacion
                            2. Apoyar la toma de desiciones basada en evidencia, mediante la publicacion de indicadores, visualizaciones y analisis asociados \
                            a los objetivos de desarrollo sostenible (ODS).
                            3. Fomentar la alfabetizacion de datos, acercando la informacion a distintos publicos de manera clara, comprensible y reutilizable.
                            4. promover la colaboracion interinstitucional, integrando datos provenientes de organismos publicos, instituciones academicas y otras\
                            entidades relevantes.
                            ` },
    { type: "image", value: imagen1, alt: "imgn referencia" },
    { type: "text", value: `El observatorio d edatos sostenibles se rige por principios de transparencia, calidad de la informacion, accesibilidad, interoperabilidad y \
                            enfoque en el usuario, alineandose con estandares nacionales e internacionales de datos abiertos y gobierno digital` },
    { type: "image", value: imagen2, alt: "imgn referencia2" },                 
    ]      
  },
  {
    id: "objetivos",
    title: "Objetivos",
     content: [
    { type: "text", value: `El Observatorio de Datos Sostenibles tiene como finalidad fortalecer el acceso, uso y valorizacion de los datos abiertos como un activo estrategico\
                            para el desarrollo sostenible, la investigacion academica y la toma de desiciones informadas. para ello, sus objetivos se estructuran en tres dimesiones\
                            complementarias: estrategicas, tecnica y administrativa, las cuales orientan el funcionamiento, crecimiento y sostenibilidad de la plataforma
                            
                            objetivo estrategico

                            consolidar al observatorio de datos sostenibles como una plataforma institucional de referencia para la recopilacion, integracion, analisis y difusion de datos\
                            abiertos vinculados al desarrollo sostenible, el territorio y las politicas publicas, contribuyendo a la generacion de conocimiento, la transparencia y la toma de\
                            desiciones basada en evidencia, tanto a nivel academico, como social.

                            el objetivo busca posicional al Observatorio como un punete entre la informacion publica, el mundo academico y la ciudaddania, promoviendo el uso responsable de los datos\
                            para enfrentar desafios sociales, economicos y ambientales, en coherencia con los objetivos de desarrollo sostenible y las estrategias de transformacion digital.
                            ` },
    { 
      type: "table", 
      headers: ["Dimensión", "Descripción"], 
      rows: [
        ["plataforma tecnologica robusta y escalable", "diseñar, implementar y mantener una plataforma tecnologica confiable, segura y escalable que permita la publicacion, busqueda y visualizacion y descarga de conjuntos de datos en formatos abiertos, garantizando su disponibilidad y correcto funcionamiento a largo plazo"],
        ["Gestion de calidad de datos y metadatos", "definir e implementar estandares tecnicos para la gestion de datos y metadatos, asegurando la calidad integridad, consistencia, trazabilidad y correcta documentacion de la informacion publicada, facilitando su reutilizacion por distintos tipos de usuarios"],
        ["Desarrollo de indicadores y visualizaciones", "Desarrollar y mantener indicadores, tableros de visualizacion y herramientas de analisis que permitan interpretar los datos de forma clara y comprensible, apoyando procesos de investigacion, planificacion, evaluacion y toma de desiciones"],
        ["interoperabilidad y reutilizacion", "Favorecer la interoperabilidad del observatorio mediante la integracion con fuentes de datos externas, repositorios institucionales y portales de datos abiertos, promoviendo el intercambio de informacion y evitando la duplicacion de esfuerzos."],
        ["Accesibilidad y experiencia de usuario", "incorporar principios de accesibilidad, usabilidad y diseño centrado en las eprsonas, asegurando que los contenidos sean navegables, comprensibles y utilizables por personas con distintos niveles de conocimiento tecnico y diversas capacidades"]
      ] 
    }                                   
    ]  
  },
  {
    id: "mision-vision",
    title: "Misión y visión",
    content:[
    { type: "text", value: `Nuestra vision
                            La vision del observatorio de datos sustentable es consolidarse como una plataforma de referencia en la gestion y difusion de datos abiertos sobre sustentabilidad a nivel\
                            regional y nacional, contribuyendo al desarrollo de politicas publicas, investigaciones academicas y proyectos de innovacion basados en la informacion confiable y accesible.
                            Se aspira a construir un ecosistema de datos que integre informacion proveniente de distintas instituciones, promueva la interoperabilidad entre sistemas y facilite el analisis \ 
                            de indicadores  relacionados con el desarrollo sostenible, alineandose con estandares internacionades de datos abiertos y gobierno digital.
                            
                            En el largo plazo, el observatorio busca impulsar una cultura de uso responable de los datos, donde la informacion sea utilizada para comprender fenomenos complejos, apoyar la planificacion \
                            territorial y fortalecer la toma de desiciones informadas en beneficio de la comunidad
                            ` },
    { type: "text", value: `Nuestra Mision
                            La mision del observatorio de datos sustentable es facilitar el acceso abierto, organizado y confiable a informacion relevatne sobre sustentabilidad, territorio y desarrollo, mediante\
                            la recopilacio, gestion y difusion de conjuntos de datos provenientes de fuentes publicas, academicas e institucionales
                            
                            A travez de esta plataforma se busca fortalecer la transparencia, promover la reutilizacion de datos y apoyar la toma de desiciones basada en evidencia, poniendo a disposicion de la comunidad \
                            datasets estructurados, metadatos estandarizados y herramientas de visualizacion que permitan comprender mejor los desafios ambientales, sociales y economicos del territorio. Asi mismo, el observatorio\
                             tiene como proposito fomentar la investigacion, la innovacion y la colaboracion entre instituciones, constribuyendo al desarrollo de soluciones sostenibles y al fortaleciiento de una cultura de datos abiertos en la sociedad` }
    ]
  },
  {
    id: "principios",
    title: "Principios",
    content:
      "Transparencia, colaboración, acceso abierto, participación ciudadana e innovación."
  },
  {
    id: "metodologia",
    title: "Metodología",
    content:
      "Trabajamos mediante recopilación de datos, análisis, colaboración institucional y publicación de información abierta."
  },
  {
    id: "equipo",
    title: "Equipo",
    content:
      "Nuestro equipo está compuesto por profesionales en datos, desarrollo web, investigación social y gestión pública."
  }
];