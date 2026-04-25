import { useRef, useState, useContext, useEffect } from "react";
import { AccessibilityContext } from "../../Context/AccessibilityContext";
import { homeSlides } from "../../Data/HomeSlides";
import "../../Styles/ComponentStyle/Home/Carrusel.css";

const API_URL = import.meta.env.VITE_API_URL;

function toStaticSlide(s, i) {
  return {
    news_post_id: s.id ?? i,
    title: s.title,
    summary: s.subtitle ?? null,
    content: s.description ?? null,
    image_url: s.img ?? null,
    published_at: s.date ?? null,
  };
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function Carrusel() {
  const carouselRef = useRef(null);
  const { fontSize, highContrast, reducedMotion } = useContext(AccessibilityContext);
  const [activeIndex, setActiveIndex] = useState(0);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/public/carousel`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.data?.length > 0) {
          setSlides(data.data);
        } else {
          setSlides(homeSlides.map(toStaticSlide));
        }
      })
      .catch(() => setSlides(homeSlides.map(toStaticSlide)))
      .finally(() => setLoading(false));
  }, []);

  const scrollToIndex = (index) => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollTo({
      left: carouselRef.current.offsetWidth * index,
      behavior: reducedMotion ? "auto" : "smooth",
    });
    setActiveIndex(index);
  };

  const scrollLeft = () => {
    if (slides.length === 0) return;
    scrollToIndex(activeIndex === 0 ? slides.length - 1 : activeIndex - 1);
  };

  const scrollRight = () => {
    if (slides.length === 0) return;
    scrollToIndex(activeIndex === slides.length - 1 ? 0 : activeIndex + 1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") scrollLeft();
    if (e.key === "ArrowRight") scrollRight();
  };

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const index = Math.round(
      carouselRef.current.scrollLeft / carouselRef.current.offsetWidth
    );
    setActiveIndex(index);
  };

  useEffect(() => {
    if (reducedMotion || slides.length <= 1) return;
    const interval = setInterval(scrollRight, 8000);
    return () => clearInterval(interval);
  }, [activeIndex, reducedMotion, slides.length]);

  if (loading) {
    return (
      <div
        className="carousel-wrapper carousel-skeleton"
        style={{ "--font-scale": fontSize }}
        aria-hidden="true"
      />
    );
  }

  if (slides.length === 0) return null;

  return (
    <div
      className={`carousel-wrapper ${highContrast ? "hc" : ""}`}
      style={{ "--font-scale": fontSize }}
    >
      <button
        className="carousel-arrow left"
        onClick={scrollLeft}
        aria-label="Slide anterior"
      >
        ‹
      </button>

      <section
        className="carousel"
        ref={carouselRef}
        tabIndex="0"
        role="region"
        aria-label="Carrusel de noticias destacadas"
        aria-live="polite"
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
      >
        {slides.map((slide, index) => (
          <article
            key={slide.news_post_id ?? index}
            className="carousel-item"
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} de ${slides.length}`}
            style={
              slide.image_url
                ? { backgroundImage: `url(${slide.image_url})` }
                : undefined
            }
          >
            <div className="carousel-overlay">
              <div className="carousel-content">
                <div className="carousel-body">
                  <span className="carousel-badge">Destacado</span>
                  <h2 className="carousel-title">{slide.title}</h2>
                  {slide.summary && (
                    <p className="carousel-subtitle">{slide.summary}</p>
                  )}
                  {slide.content && (
                    <p className="carousel-description">{slide.content}</p>
                  )}
                </div>
                <div className="carousel-footer">
                  <span className="carousel-date">
                    📅 {formatDate(slide.published_at)}
                  </span>
                  {(slide.link_url || slide.slug) && (
                    <a
                      href={slide.link_url || `/noticias/${slide.slug}`}
                      className="carousel-btn"
                    >
                      Ver más
                    </a>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      <button
        className="carousel-arrow right"
        onClick={scrollRight}
        aria-label="Slide siguiente"
      >
        ›
      </button>

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
    </div>
  );
}

export default Carrusel;
