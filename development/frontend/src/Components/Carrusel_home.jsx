import { useRef, useState, useContext } from "react";
import { AccessibilityContext } from "../context/AccessibilityContext";

import slide1 from "../assets/slide1.jpeg";
import slide2 from "../assets/slide2.png";
import slide3 from "../assets/slide3.png";

import "../styles/Component_styles/Carrusel_home.css";

function Carrusel_home() {
  const carouselRef = useRef(null);
  const { fontSize, highContrast, reducedMotion } = useContext(AccessibilityContext);
  const [activeIndex, setActiveIndex] = useState(0);

  const slidesData = [
    {
      img: slide1,
      alt: "Gráfico representativo del consumo energético regional entre 2019 y 2024",
      title: "Nuevo conjunto de datos sobre consumo energético regional",
      subtitle: "Información actualizada por región, sector productivo y tipo de fuente energética (2019 - 2024)",
      description: "El observatorio de Datos Sostenibles incorpora un nuevo conjunto de datos que permite analizar el consumo energético a nivel regional, identificar brechas territoriales y apoyar la planificación energética.",
      date: "12 Enero 2026",
      link: "#"
    },
    {
      img: slide2,
      alt: "Visualización estadística complementaria",
      title: "Título 2",
      description: "Texto explicativo del slide 2",
      date: "15 Enero 2026",
      link: "#"
    },
    {
      img: slide3,
      alt: "Panel de datos comparativos",
      title: "Título 3",
      description: "Texto explicativo del slide 3",
      date: "18 Enero 2026",
      link: "#"
    }
  ];

  const scrollLeft = () => {
    carouselRef.current.scrollBy({
      left: -carouselRef.current.offsetWidth,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  const scrollRight = () => {
    carouselRef.current.scrollBy({
      left: carouselRef.current.offsetWidth,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") scrollLeft();
    if (e.key === "ArrowRight") scrollRight();
  };

  return (
    <div
      className={`carousel-wrapper ${highContrast ? "hc" : ""}`}
      style={{ fontSize: `${fontSize}rem` }}
    >
      {/* Flecha izquierda */}
      <button
        className="carousel-arrow left"
        onClick={scrollLeft}
        aria-label="Slide anterior"
      >
        <span aria-hidden="true">‹</span>
      </button>

      <section
        className="carousel"
        ref={carouselRef}
        tabIndex="0"
        onKeyDown={handleKeyDown}
        role="region"
        aria-label="Carrusel de noticias destacadas"
      >
        {slidesData.map((slide, index) => (
          <div
            key={index}
            className="carousel-item"
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} de ${slidesData.length}`}
          >
            <img src={slide.img} alt={slide.alt} />

            <div className="carousel-content">
              <div className="carousel-body">
                <h2 className="carousel-title">{slide.title}</h2>
                {slide.subtitle && <h4 className="carousel-subtitle">{slide.subtitle}</h4>}
                <p className="carousel-description">{slide.description}</p>
              </div>
              <div className="carousel-footer">
                <span className="carousel-date">📅 {slide.date}</span>
                {slide.link && (
                  <button
                    className="carousel-btn"
                    onClick={() => window.location.href = slide.link}
                  >
                    Ver más
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Flecha derecha */}
      <button
        className="carousel-arrow right"
        onClick={scrollRight}
        aria-label="Slide siguiente"
      >
        <span aria-hidden="true">›</span>
      </button>
    </div>
  );
}

export default Carrusel_home;