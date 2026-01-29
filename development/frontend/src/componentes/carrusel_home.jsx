import { useRef } from "react";
import slide1 from "../assets/slide1.jpeg";
import slide2 from "../assets/slide2.png";
import slide3 from "../assets/slide3.png";
import "../styles/componentes_styles/carrusel_home.css";

function Carrusel_home() {
  const carouselRef = useRef(null);

  const scrollLeft = () => {
    carouselRef.current.scrollBy({
      left: -carouselRef.current.offsetWidth,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    carouselRef.current.scrollBy({
      left: carouselRef.current.offsetWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className="carousel-wrapper">
      {/* Flecha izquierda */}
      <button className="carousel-arrow left" onClick={scrollLeft}>
        ‹
      </button>

      {/* Carrusel */}
      <section className="carousel" ref={carouselRef}>
        <div className="carousel-item">
          <img src={slide1} alt="Slide 1" />
          <div className="carousel-content">
            <div className="carousel-body">
                <h2 className="carousel-title">
                Nuevo conjunto de datos sobre consumo energético regional
                </h2>

                <h4 className="carousel-subtitle">
                Información Actualizada por región, sector productivo y tipo 
                de fuente energética (2019 - 2024)
                </h4>

                <p className="carousel-description">
                El observatorio de Datos Sostenibles incorpora un nuevo conjunto de datos 
                que permite analizar el consumo energético a nivel regional, identificar brechas 
                territoriales y apoyar la planificación energética en el marco de los objetivos de 
                desarrollo sostenible.
                </p>
            </div>

            <div className="carousel-footer">
                <span className="carousel-date">📅 12 Enero 2026</span>
                <button className="carousel-btn">Ver más</button>
            </div>
        </div>

        </div>

        <div className="carousel-item">
          <img src={slide2} alt="Slide 2" />
          <div className="carousel-text">
            <h2>Título 2</h2>
            <p>Texto explicativo del slide 2</p>
          </div>
        </div>

        <div className="carousel-item">
          <img src={slide3} alt="Slide 3" />
          <div className="carousel-text">
            <h2>Título 3</h2>
            <p>Texto explicativo del slide 3</p>
          </div>
        </div>
      </section>

      {/* Flecha derecha */}
      <button className="carousel-arrow right" onClick={scrollRight}>
        ›
      </button>
    </div>
  );
}

export default Carrusel_home;
