import { useState } from "react";
import "../../Styles/Pages_styles/Admin/GestionInstituciones.css";

function GestionInstituciones() {

  const [instituciones, setInstituciones] = useState([
    { id: 1, nombre: "Universidad de Chile", direccion: "Santiago", telefono: "123456789" },
    { id: 2, nombre: "Instituto Profesional AIEP", direccion: "La Serena", telefono: "987654321" }
  ]);

  const [nuevaInstitucion, setNuevaInstitucion] = useState({
    nombre: "",
    direccion: "",
    telefono: ""
  });

  const handleChange = (e) => {
    setNuevaInstitucion({
      ...nuevaInstitucion,
      [e.target.name]: e.target.value
    });
  };

  const agregarInstitucion = () => {
    if (!nuevaInstitucion.nombre) return;

    const nueva = {
      id: Date.now(),
      ...nuevaInstitucion
    };

    setInstituciones([...instituciones, nueva]);

    setNuevaInstitucion({
      nombre: "",
      direccion: "",
      telefono: ""
    });
  };

  const eliminarInstitucion = (id) => {
    setInstituciones(instituciones.filter(inst => inst.id !== id));
  };

  return (
    <div className="gestion-instituciones">

      <h1>Gestión de Instituciones</h1>

      {/* FORMULARIO */}
      <div className="formulario">
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={nuevaInstitucion.nombre}
          onChange={handleChange}
        />
        <input
          type="text"
          name="direccion"
          placeholder="Dirección"
          value={nuevaInstitucion.direccion}
          onChange={handleChange}
        />
        <input
          type="text"
          name="telefono"
          placeholder="Teléfono"
          value={nuevaInstitucion.telefono}
          onChange={handleChange}
        />

        <button onClick={agregarInstitucion}>
          Agregar
        </button>
      </div>

      {/* TABLA */}
      <table className="tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Dirección</th>
            <th>Teléfono</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {instituciones.map(inst => (
            <tr key={inst.id}>
              <td>{inst.nombre}</td>
              <td>{inst.direccion}</td>
              <td>{inst.telefono}</td>
              <td>
                <button className="btn-eliminar" onClick={() => eliminarInstitucion(inst.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}

export default GestionInstituciones;