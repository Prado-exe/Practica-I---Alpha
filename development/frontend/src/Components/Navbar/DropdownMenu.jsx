import { useState } from "react";
import { Link } from "react-router-dom";

function DropdownMenu({ links }) {

  const [open, setOpen] = useState(false);

  const toggleMenu = () => {
    setOpen(!open);
  };

  return (
    <div className="dropdown">

      <button
        className="dropdown-btn"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={toggleMenu}
      >
        Sobre nosotros ▾
      </button>

      {open && (
        <div className="dropdown-menu">

          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="dropdown-item"
              onClick={() => setOpen(true)}
            >
              {link.label}
            </Link>
          ))}

        </div>
      )}

    </div>
  );
}

export default DropdownMenu;