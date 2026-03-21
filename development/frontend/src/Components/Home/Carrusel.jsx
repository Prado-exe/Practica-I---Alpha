import { useRef, useState, useContext, useEffect } from "react";
import { AccessibilityContext } from "../../Context/AccessibilityContext";
import { homeSlides } from "../../Data/HomeSlides";

import "../../Styles/ComponentStyle/Home/Carrusel.css";

function Carrusel() {

  const carouselRef = useRef(null);

  const { fontSize, highContrast, reducedMotion } =
    useContext(AccessibilityContext);

  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = (index) => {

    const width = carouselRef.current.offsetWidth;

    carouselRef.current.scrollTo({
      left: width * index,
      behavior: reducedMotion ? "auto" : "smooth",
    });

    setActiveIndex(index);
  };

  const scrollLeft = () => {
    const newIndex =
      activeIndex === 0 ? homeSlides.length - 1 : activeIndex - 1;
    scrollToIndex(newIndex);
  };

  const scrollRight = () => {
    const newIndex =
      activeIndex === homeSlides.length - 1 ? 0 : activeIndex + 1;
    scrollToIndex(newIndex);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") scrollLeft();
    if (e.key === "ArrowRight") scrollRight();
  };

  const handleScroll = () => {
    const scrollPosition = carouselRef.current.scrollLeft;
    const width = carouselRef.current.offsetWidth;

    const index = Math.round(scrollPosition / width);

    setActiveIndex(index);
  };

  /* autoplay accesible */
  useEffect(() => {

    if (reducedMotion) return;

    const interval = setInterval(() => {
      scrollRight();
    }, 8000);

    return () => clearInterval(interval);

  }, [activeIndex, reducedMotion]);

  return (
    <div
      className={`carousel-wrapper ${highContrast ? "hc" : ""}`}
      style={{ "--font-scale": fontSize }}
    >
      {/* Flecha izquierda */}
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
        {homeSlides.map((slide, index) => (
          <article
            key={slide.id}
            className="carousel-item"
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} de ${homeSlides.length}`}
          >
            <img src={slide.img} alt={slide.alt} loading="lazy" />

            <div className="carousel-content">
              <div className="carousel-body">

                <h2 className="carousel-title">{slide.title}</h2>

                {slide.subtitle && (
                  <h3 className="carousel-subtitle">{slide.subtitle}</h3>
                )}

                <p className="carousel-description">
                  {slide.description}
                </p>

              </div>

              <div className="carousel-footer">

                <span className="carousel-date">
                  📅 {slide.date}
                </span>

                {slide.link && (
                  <a
                    href={slide.link}
                    className="carousel-btn"
                  >
                    Ver más
                  </a>
                )}

              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Flecha derecha */}
      <button
        className="carousel-arrow right"
        onClick={scrollRight}
        aria-label="Slide siguiente"
      >
        ›
      </button>

      {/* dots */}
      <div className="carousel-dots">
        {homeSlides.map((_, index) => (
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