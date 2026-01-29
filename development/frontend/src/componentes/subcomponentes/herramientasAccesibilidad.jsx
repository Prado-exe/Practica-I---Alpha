import { useState, useEffect } from "react";
import "../../styles/subcomponentes_styles/herramientasAccesibilidad.css";
import { MdTextIncrease , MdTextDecrease  } from "react-icons/md";
import { FaAdjust } from "react-icons/fa";

const MIN_FONT = 0.8;
const MAX_FONT = 1.4; 
const STEP = 0.1;     

function HerramientasAccesibilidad(){
    const [highContrast, setHighContrast] = useState(false);
    const [fontScale, setFontScale] = useState(1);

    {/*-- boton modo contraste --*/}
    const toggleContrast = () => {
        setHighContrast(!highContrast);                   // A MI YO DEL FUTURO MODO CONTRASTE EN PROGRESO
        document.body.classList.toggle("high-contrast");  // REQUIERE MODIFICAR VARIAS COSAS EN LOS CSS
    };                                                    // ADEMAS DE ALGUNOS CAMBIOS A LOS COLORES, ACUERDATE !!!

    {/*-- botones maxear-minimizar font --*/}  
    const increaseText = () => {
        setFontScale(prev => Math.min(prev + STEP, MAX_FONT));
    };
    const decreaseText = () => {
        setFontScale(prev => Math.max(prev - STEP, MIN_FONT));
    };
    useEffect(() => {
        document.documentElement.style.fontSize = `${fontScale * 100}%`; //-> esto se encarga de aplicar el cambio de font
    }, [fontScale]);


  return (
    <div className="accessibility-toolbar" role="toolbar" aria-label="Herramientas de accesibilidad">

      <button
        className="toolbar-btn"
        onClick={toggleContrast}
        aria-pressed={highContrast}
      >
        <FaAdjust/>
      </button>

      <button
        className="toolbar-btn"       // PENDIENTE SI COLOCO O NO EL LABEL EMERGENTE QUE DIGA QUE HACE
        onClick={decreaseText}        // DEFINIRLO LUEGO
      >
        <MdTextDecrease/>
      </button>

      <button
        className="toolbar-btn"
        onClick={increaseText}
      >
        <MdTextIncrease/>
      </button>

    </div>
 );
};

export default HerramientasAccesibilidad;