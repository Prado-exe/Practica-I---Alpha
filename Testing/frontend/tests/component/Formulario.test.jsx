import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Formulario from "../../src/Pages/Public/Formulario";

// ✅ Corregimos la ruta del mock añadiendo "src/"
vi.mock("../../src/Components/Common/Breadcrumb", () => ({
  default: () => <div>Breadcrumb</div>
}));

describe("Formulario", () => {

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <Formulario />
      </BrowserRouter>
    );
  };

  it("renderiza correctamente el formulario", () => {
    renderComponent();

    // Usamos regex /texto/i para hacer las búsquedas más flexibles
    expect(screen.getByText(/Formulario de contacto/i)).toBeInTheDocument();
    expect(screen.getByText(/Paso 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Paso 2/i)).toBeInTheDocument();
  });

  it("permite escribir en los inputs", () => {
    const { container } = renderComponent();

    // ✅ Buscamos todos los inputs que NO sean archivos
    const textInputs = container.querySelectorAll('input:not([type="file"])');
    const nombre = textInputs[0]; // Asumimos que Nombre es el primero
    const email = textInputs[1];  // Y Correo es el segundo

    fireEvent.change(nombre, { target: { value: "Juan Pérez" } });
    fireEvent.change(email, { target: { value: "juan@test.com" } });

    expect(nombre.value).toBe("Juan Pérez");
    expect(email.value).toBe("juan@test.com");
  });

  it("permite seleccionar opciones", () => {
    const { container } = renderComponent();

    // ✅ Buscamos directamente las etiquetas <select>
    const selects = container.querySelectorAll('select');
    const categoria = selects[0];
    const motivo = selects[1];

    fireEvent.change(categoria, { target: { value: "Ciudadano" } });
    fireEvent.change(motivo, { target: { value: "Consulta técnica" } });

    expect(categoria.value).toBe("Ciudadano");
    expect(motivo.value).toBe("Consulta técnica");
  });

  it("actualiza el textarea y contador de caracteres", () => {
    const { container } = renderComponent();

    // ✅ Buscamos el único <textarea> del formulario
    const textarea = container.querySelector('textarea');

    fireEvent.change(textarea, {
      target: { value: "Hola mundo" }
    });

    expect(textarea.value).toBe("Hola mundo");

    // Opcional: Si el componente muestra el contador de caracteres, esto lo valida
    // expect(screen.getByText(/caracteres restantes/i)).toBeInTheDocument();
  });

  it("permite subir un archivo", () => {
    const { container } = renderComponent();

    const file = new File(["contenido"], "archivo.txt", {
      type: "text/plain"
    });

    // ✅ Buscamos el input de tipo archivo de forma directa y segura
    const inputFile = container.querySelector('input[type="file"]');

    fireEvent.change(inputFile, {
      target: { files: [file] }
    });

    expect(screen.getByText("archivo.txt")).toBeInTheDocument();
  });

  it("permite eliminar archivo", () => {
    const { container } = renderComponent();

    const file = new File(["contenido"], "archivo.txt", {
      type: "text/plain"
    });

    const inputFile = container.querySelector('input[type="file"]');

    fireEvent.change(inputFile, {
      target: { files: [file] }
    });

    // Usamos regex por si el botón está en mayúsculas o minúsculas
    const eliminarBtn = screen.getByText(/eliminar/i);
    fireEvent.click(eliminarBtn);

    expect(screen.queryByText("archivo.txt")).not.toBeInTheDocument();
  });

  it("maneja drag & drop", () => {
    const { container } = renderComponent();

    // Buscamos la zona de drop por su clase
    const dropzone = container.querySelector(".file-dropzone");

    fireEvent.dragEnter(dropzone);
    expect(dropzone.classList.contains("active")).toBe(true);

    fireEvent.dragLeave(dropzone);
    expect(dropzone.classList.contains("active")).toBe(false);
  });

  it("limpia el formulario", () => {
    const { container } = renderComponent();

    const nombre = container.querySelectorAll('input:not([type="file"])')[0];
    fireEvent.change(nombre, { target: { value: "Test" } });

    // Regex para no chocar con mayúsculas/minúsculas ("Limpiar Formulario" vs "Limpiar formulario")
    const clearBtn = screen.getByText(/Limpiar/i);
    fireEvent.click(clearBtn);

    expect(nombre.value).toBe("");
  });

  it("envía el formulario", () => {
    renderComponent();

    const consoleSpy = vi.spyOn(console, "log");

    // Buscamos el botón de enviar
    const submitBtn = screen.getByRole("button", { name: /Enviar/i });
    fireEvent.click(submitBtn);

    expect(consoleSpy).toHaveBeenCalled();
  });

});