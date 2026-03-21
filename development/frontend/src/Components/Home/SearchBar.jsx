import { useState } from "react";
import "../../Styles/ComponentStyle/Home/SearchBar.css";

function SearchBar() {

  const [search, setSearch] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();

    if (!search.trim()) return;

    console.log("Buscando:", search);
  };

  return (
    <section className="search-container">

      <form
        className="search-form"
        role="search"
        onSubmit={handleSearch}
      >

        <div className="search-bar">

          <input
            id="home-search"
            type="search"
            placeholder="Buscar datasets, noticias o publicaciones..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            type="submit"
            className="search-btn"
            aria-label="Buscar"
          >
            🔍
          </button>

        </div>

      </form>

    </section>
  );
}

export default SearchBar;