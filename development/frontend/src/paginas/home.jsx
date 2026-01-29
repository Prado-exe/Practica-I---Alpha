import { useState, useEffect } from "react";
import Carrusel_home from "../componentes/carrusel_home";
import Expositor_PopData from "../componentes/expositor_PopData_home";
import Expositor_UltPublic from "../componentes/expositor_UltPublic_home";

import "../styles/paginas_styles/home.css";

function Home() {
  const [loadingCarousel, setLoadingCarousel] = useState(true);

  useEffect(() => {
    // Simula carga (API, imágenes, etc.)
    const timer = setTimeout(() => {
      setLoadingCarousel(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>


      <main className="home">
        {/* Carrusel */}
        <Carrusel_home loading={loadingCarousel} />

        {/* Buscador */}
        <section className="search-container">
          <input
            type="text"
            placeholder="Buscar..."
            className="search-input"
          />
        </section>

        {/* Expositor datos relevantes */}
        <Expositor_PopData />

        {/* Expositor ultimas public*/}
        <Expositor_UltPublic />

      </main>

    </>
  );
}

export default Home;
