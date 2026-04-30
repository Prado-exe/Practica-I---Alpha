import React, { useState } from 'react';
import { 
    ChevronDown, 
    ChevronUp, 
    HelpCircle 
} from 'lucide-react';
import "../../Styles/Pages_styles/Public/PreguntasFrecuentes.css";

const PreguntasFrecuentes = () => {
    const [activeIndex, setActiveIndex] = useState(null);

    // DATA AGRUPADA POR CATEGORÍAS (SEGÚN IMÁGENES)
    const faqData = [
        {
            categoria: "📊 Catálogo de Datasets",
            preguntas: [
                { id: 1, pregunta: "¿Qué es un dataset en el Observatorio?", respuesta: "Un dataset es un conjunto estructurado de datos públicos organizados para su consulta, visualización y descarga, publicado por una institución o entidad colaboradora." },
                { id: 2, pregunta: "¿Cómo puedo buscar un dataset específico?", respuesta: "Puedes utilizar el buscador principal o aplicar filtros por categoría, institución, formato, fecha de actualización o palabras clave." },
                { id: 3, pregunta: "¿Qué significa que un dataset esté “actualizado”?", respuesta: "Indica que la institución responsable ha publicado una versión reciente del conjunto de datos con información revisada o ampliada." },
                { id: 4, pregunta: "¿Cómo sé si un dataset es confiable?", respuesta: "Cada dataset incluye información sobre su fuente, fecha de publicación, frecuencia de actualización y metadatos técnicos." },
                { id: 5, pregunta: "¿Qué son los metadatos?", respuesta: "Son datos descriptivos que explican el contenido, origen, estructura, periodicidad y responsable del dataset." }
            ]
        },
        {
            categoria: "📥 Descargas y Formatos",
            preguntas: [
                { id: 6, pregunta: "¿En qué formatos puedo descargar los datos?", respuesta: "Los datasets pueden estar disponibles en formatos como CSV, XLSX, JSON u otros formatos estructurados." },
                { id: 7, pregunta: "¿Necesito crear una cuenta para descargar datos?", respuesta: "No es obligatorio. Sin embargo, una cuenta permite guardar favoritos y recibir notificaciones de actualizaciones." },
                { id: 8, pregunta: "¿Qué hago si un archivo no se descarga correctamente?", respuesta: "Puedes intentar nuevamente o contactar al equipo de soporte indicando el nombre del dataset y el formato seleccionado." },
                { id: 9, pregunta: "¿Puedo reutilizar los datos para proyectos académicos o comerciales?", respuesta: "Sí, siempre que se respeten las condiciones de uso y se cite la fuente correspondiente." },
                { id: 10, pregunta: "¿El Observatorio ofrece acceso vía API?", respuesta: "No, hasta el momento el observatorio de datos no ofrece acceso vía API." }
            ]
        },
        {
            categoria: "📰 Noticias y Publicaciones",
            preguntas: [
                { id: 11, pregunta: "¿Cuál es la diferencia entre Noticias y Publicaciones?", respuesta: "Las Noticias informan sobre actualizaciones del Observatorio (nuevos datasets, mejoras, indicadores). Las Publicaciones son artículos analíticos basados en datos, con interpretación y visualizaciones." },
                { id: 12, pregunta: "¿Con qué frecuencia se publican nuevas noticias?", respuesta: "Las noticias se publican cada vez que existe una actualización relevante del portal o del catálogo." },
                { id: 13, pregunta: "¿Qué tipo de contenido incluyen las Publicaciones?", respuesta: "Incluyen análisis de datos, estudios temáticos, informes de indicadores y artículos informativos basados en datos abiertos." },
                { id: 14, pregunta: "¿Las publicaciones contienen visualizaciones de datos?", respuesta: "Sí. Muchas publicaciones incluyen gráficos, tablas y representaciones visuales para facilitar la comprensión." }
            ]
        },
        {
            categoria: "🏛️ Instituciones y Fuentes",
            preguntas: [
                { id: 15, pregunta: "¿Quién publica los datasets en el Observatorio?", respuesta: "Instituciones públicas, organismos académicos y entidades colaboradoras." },
                { id: 16, pregunta: "¿Cómo se valida la información publicada?", respuesta: "El Observatorio verifica la coherencia técnica y la correcta documentación del dataset antes de su publicación." },
                { id: 17, pregunta: "¿Puedo sugerir que una institución publique datos en el portal?", respuesta: "Sí. Puedes enviar una sugerencia mediante el formulario de contacto." }
            ]
        },
        {
            categoria: "👤 Cuenta y Seguridad",
            preguntas: [
                { id: 18, pregunta: "¿Cómo creo una cuenta en el Observatorio?", respuesta: "Puedes registrarte desde la sección “Crear cuenta” ingresando tus datos básicos." },
                { id: 19, pregunta: "¿Cómo restablezco mi contraseña?", respuesta: "Desde el login selecciona “Restablecer contraseña” y sigue las instrucciones enviadas a tu correo." },
                { id: 20, pregunta: "¿Qué es la autenticación en dos pasos (2FA)?", respuesta: "Es una medida de seguridad adicional que requiere un código temporal además de tu contraseña." },
                { id: 21, pregunta: "¿Puedo modificar mis datos personales?", respuesta: "Sí. Desde tu perfil puedes actualizar tu información básica y preferencias." }
            ]
        },
        {
            categoria: "📞 Soporte y Contacto",
            preguntas: [
                { id: 22, pregunta: "¿Cómo puedo contactar al equipo del Observatorio?", respuesta: "Puedes utilizar el formulario de contacto disponible en la sección “Contacto”." },
                { id: 23, pregunta: "¿Cuánto tiempo tarda una respuesta?", respuesta: "El equipo responde generalmente dentro de 24 a 72 horas hábiles." },
                { id: 24, pregunta: "¿Puedo reportar un error en un dataset?", respuesta: "Sí. En la página del dataset encontrarás la opción para reportar inconsistencias o errores." },
                { id: 25, pregunta: "¿Dónde puedo enviar sugerencias de mejora del portal?", respuesta: "Las sugerencias pueden enviarse a través del formulario de contacto." }
            ]
        }
    ];

    const toggleAccordion = (id) => {
        setActiveIndex(activeIndex === id ? null : id);
    };

    return (
        <div className="faq-page-wrapper">
            <header className="faq-hero">
                <div className="faq-hero-icon">
                    <HelpCircle size={40} color="#3182ce" />
                </div>
                <h1>Centro de Ayuda</h1>
                <p>Todo lo que necesitas saber sobre el Observatorio de Datos</p>
            </header>

            <main className="faq-content-container">
                {faqData.map((seccion, sIdx) => (
                    <section key={sIdx} className="faq-category-group">
                        <h2 className="faq-category-title">{seccion.categoria}</h2>
                        <div className="faq-list">
                            {seccion.preguntas.map((faq) => (
                                <div 
                                    key={faq.id} 
                                    className={`faq-item ${activeIndex === faq.id ? 'active' : ''}`}
                                >
                                    <button 
                                        className="faq-question-btn" 
                                        onClick={() => toggleAccordion(faq.id)}
                                        aria-expanded={activeIndex === faq.id}
                                    >
                                        <span>{faq.pregunta}</span>
                                        {activeIndex === faq.id ? (
                                            <ChevronUp className="faq-chevron" size={20} />
                                        ) : (
                                            <ChevronDown className="faq-chevron" size={20} />
                                        )}
                                    </button>
                                    
                                    <div className="faq-answer-wrapper">
                                        <div className="faq-answer-text">
                                            {faq.respuesta}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </main>
        </div>
    );
};

export default PreguntasFrecuentes;