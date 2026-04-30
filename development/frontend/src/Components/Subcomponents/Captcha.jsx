import { useState } from "react";

function Captcha({ onVerify }) {

  const [status, setStatus] = useState("idle");

  const handleCaptcha = async () => {

    if (status !== "idle") return;

    setStatus("loading");

    try {

      const response = await fetch("http://localhost:3000/api/captcha", {
        method: "POST"
      });

      const data = await response.json();

      if (data.success) {

        setStatus("success");

        if (onVerify) {
          onVerify(data.token);
        }

      } else {

        setStatus("error");

      }

    } catch (error) {

      console.error(error);
      setStatus("error");

    }

  };

  return (

    <div
      className={`captcha ${status}`}
      onClick={handleCaptcha}
      role="checkbox"
      aria-checked={status === "success"}
      tabIndex="0"
    >

      {status === "idle" && (
        <>
          <div className="captcha-box"></div>
          <span>No soy un robot</span>
        </>
      )}

      {status === "loading" && (
        <>
          <div className="captcha-spinner"></div>
          <span>Verificando...</span>
        </>
      )}

      {status === "success" && (
        <>
          <div className="captcha-check">✔</div>
          <span>Verificado</span>
        </>
      )}

      {status === "error" && (
        <>
          <div className="captcha-box"></div>
          <span>Error de verificación</span>
        </>
      )}

    </div>
  );
}

export default Captcha;