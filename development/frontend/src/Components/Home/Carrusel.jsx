import { useRef, useState, useContext, useEffect } from "react";
import { AccessibilityContext } from "../../Context/AccessibilityContext";
import "../../Styles/ComponentStyle/Home/Carrusel.css";

// 📡 Importamos los servicios reales
import { getNoticias } from "../../Services/NoticiasService";
import { getPublications } from "../../Services/PublicacionesService";
// import { getPublicDatasets } from "../../Services/DatasetsService"; 

function Carrusel() {
  const carouselRef = useRef(null);
  const { fontSize, highContrast, reducedMotion } = useContext(AccessibilityContext);

  // Estados dinámicos
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // 🔄 Cargar contenido destacado al montar el componente
  useEffect(() => {
    const fetchFeaturedContent = async () => {
      try {
        setLoading(true);
        const [newsRes, pubRes] = await Promise.all([
          getNoticias({ limit: 10 }),
          getPublications({ limit: 10 })
        ]);

        const featuredNews = newsRes.data
          .filter(n => n.isFeatured)
          .map(n => ({
            id: `news-${n.id}`,
            img: n.image,
            alt: n.title,
            title: n.title,
            subtitle: "Noticia Destacada",
            description: n.description,
            date: new Date(n.date).toLocaleDateString(),
            link: `/noticias/${n.slug}`
          }));

        const featuredPubs = pubRes.data
          .filter(p => p.isFeatured)
          .map(p => ({
            id: `pub-${p.id}`,
            img: p.image,
            alt: p.title,
            title: p.title,
            subtitle: "Publicación Destacada",
            description: p.description,
            date: new Date(p.date).toLocaleDateString(),
            link: `/publicaciones/${p.slug}`
          }));

        const combinedSlides = [...featuredNews, ...featuredPubs];

        if (combinedSlides.length === 0) {
          setSlides([{
            id: "default-slide",
            img: "/img/default-news.jpg", // Asegúrate de tener esta imagen o cambiar la ruta
            alt: "Bienvenido al Observatorio",
            title: "Bienvenido al Observatorio",
            subtitle: "Explora nuestros datos",
            description: "Encuentra noticias, publicaciones y datasets relevantes en nuestra plataforma centralizada.",
            date: new Date().toLocaleDateString(),
            link: "/noticias"
          }]);
        } else {
          setSlides(combinedSlides);
        }
      } catch (error) {
        console.error("Error cargando el carrusel:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedContent();
  }, []);

  const scrollToIndex = (index) => {
    if (!carouselRef.current) return;
    const width = carouselRef.current.offsetWidth;
    carouselRef.current.scrollTo({
      left: width * index,
      behavior: reducedMotion ? "auto" : "smooth",
    });
    setActiveIndex(index);
  };

  const scrollLeft = () => {
    const newIndex = activeIndex === 0 ? slides.length - 1 : activeIndex - 1;
    scrollToIndex(newIndex);
  };

  const scrollRight = () => {
    const newIndex = activeIndex === slides.length - 1 ? 0 : activeIndex + 1;
    scrollToIndex(newIndex);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") scrollLeft();
    if (e.key === "ArrowRight") scrollRight();
  };

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const scrollPosition = carouselRef.current.scrollLeft;
    const width = carouselRef.current.offsetWidth;
    // Añadimos un pequeño margen para evitar saltos raros al hacer scroll manual
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  useEffect(() => {
    if (reducedMotion || slides.length <= 1) return;
    const interval = setInterval(() => {
      scrollRight();
    }, 8000);
    return () => clearInterval(interval);
  }, [activeIndex, reducedMotion, slides.length]);

  if (loading) {
    return <div className="carousel-wrapper carousel-skeleton"></div>;
  }

  return (
    <div
      className={`carousel-wrapper ${highContrast ? "hc" : ""}`}
      style={{ "--font-scale": fontSize }}
    >
      {slides.length > 1 && (
        <button className="carousel-arrow left" onClick={scrollLeft} aria-label="Slide anterior">
          ‹
        </button>
      )}

      <section
        className="carousel"
        ref={carouselRef}
        tabIndex="0"
        role="region"
        aria-label="Carrusel de contenido destacado"
        aria-live="polite"
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
      >
        {slides.map((slide, index) => (
          <article
            key={slide.id}
            className="carousel-item"
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} de ${slides.length}`}
          >
            {/* 1. Imagen controlada como capa inferior */}
            <img 
              src={slide.img} 
              alt={slide.alt} 
              loading="lazy" 
              className="carousel-bg-image" 
            />

            {/* 2. Capa oscura para que el texto resalte (Faltaba en tu código) */}
            <div className="carousel-overlay"></div>

            {/* 3. Contenido principal */}
            <div className="carousel-content">
              <div className="carousel-body">
                {slide.subtitle && (
                  <span className="carousel-badge">{slide.subtitle}</span>
                )}
                <h2 className="carousel-title">{slide.title}</h2>
                <p className="carousel-description">{slide.description}</p>
              </div>

              <div className="carousel-footer">
                <span className="carousel-date">📅 {slide.date}</span>
                {slide.link && (
                  <a href={slide.link} className="carousel-btn">Leer más</a>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      {slides.length > 1 && (
        <button className="carousel-arrow right" onClick={scrollRight} aria-label="Slide siguiente">
          ›
        </button>
      )}

      {slides.length > 1 && (
        <div className="carousel-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === activeIndex ? "active" : ""}`}
              aria-label={`Ir al slide ${index + 1}`}
              onClick={() => scrollToIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Carrusel;