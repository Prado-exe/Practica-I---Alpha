import { useState } from "react";
import Carrusel_home from "../Components/Carrusel_home";
import Expositor_PopularData from "../Components/Expositor_PopularData"
import Expositor_LastPost from "../Components/expositor_LastPost";


import "../Styles/Pages_styles/Home.css";  

function Home() {
  const [search, setSearch] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Buscando:", search);

  };

  return (
    <main className="home" role="main">
      {/* carrusel */}
      <Carrusel_home />
      {/* Buscador */}
      <section className="search-container" aria-labelledby="search-heading">
        <form role="search" aria-label="Buscador del sitio">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              id="home-search"
              type="search"
              placeholder="Buscar..."
              className="search-input"
            />
          </div>
        </form>
      </section>
      {/* exp datos populares */}
      <Expositor_PopularData />
      {/* exp datos populares */}
      <Expositor_LastPost />
    </main>
  );
}

export default Home;
