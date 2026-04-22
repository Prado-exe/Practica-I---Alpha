import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "../../styles/ComponentStyle/Navbar/DropdownMenu.css";

function DropdownMenu({ links }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  /* CLICK FUERA */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ESC */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div
      className={`dropdown ${open ? "open" : ""}`}
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="dropdown-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
          }
        }}
      >
        Sobre nosotros ▾
      </button>

      <div className="dropdown-menu" role="menu">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            role="menuitem"
            className="dropdown-item"
            onClick={() => setOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default DropdownMenu;