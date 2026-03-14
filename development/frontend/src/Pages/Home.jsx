import Carrusel_home from "../Components/Home/Carrusel";
import SearchBar from "../Components/Home/SearchBar";
import Expositor_PopularData from "../Components/Home/PopularData";
import Expositor_LastPost from "../Components/Home/LastPost";

import "../Styles/Pages_styles/Home.css";

function Home() {
  return (
    <main className="home" role="main">
      {/* Carrusel */}
      <Carrusel_home />
      {/* Buscador */}
      <SearchBar/>
      {/* Datos populares */}
      <Expositor_PopularData />
      {/* Últimas publicaciones */}
      <Expositor_LastPost />

    </main>
  );
}

export default Home;

