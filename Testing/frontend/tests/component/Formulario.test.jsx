import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Formulario from "../../src/Pages/Public/Formulario";

// Mock Breadcrumb (no lo necesitas testear aquí)
vi.mock("../../Components/Common/Breadcrumb", () => ({
  default: () => <div>Breadcrumb</div>
}));

describe("Formulario", () => {

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <Formulario />
      </BrowserRouter>
    );

  it("renderiza correctamente el formulario", () => {
    renderComponent();

    expect(screen.getByText("Formulario de contacto")).toBeInTheDocument();
    expect(screen.getByText("Paso 1")).toBeInTheDocument();
    expect(screen.getByText("Paso 2")).toBeInTheDocument();
  });

  it("permite escribir en los inputs", () => {
    renderComponent();

    const nombre = screen.getByLabelText(/Nombre y apellido/i);
    const email = screen.getByLabelText(/Dirección de correo/i);

    fireEvent.change(nombre, { target: { value: "Juan Pérez" } });
    fireEvent.change(email, { target: { value: "juan@test.com" } });

    expect(nombre.value).toBe("Juan Pérez");
    expect(email.value).toBe("juan@test.com");
  });

  it("permite seleccionar opciones", () => {
    renderComponent();

    const categoria = screen.getByLabelText(/Categoría de usuario/i);
    const motivo = screen.getByLabelText(/Motivo de consulta/i);

    fireEvent.change(categoria, { target: { value: "Ciudadano" } });
    fireEvent.change(motivo, { target: { value: "Consulta técnica" } });

    expect(categoria.value).toBe("Ciudadano");
    expect(motivo.value).toBe("Consulta técnica");
  });

  it("actualiza el textarea y contador de caracteres", () => {
    renderComponent();

    const textarea = screen.getByLabelText(/Mensaje/i);

    fireEvent.change(textarea, {
      target: { value: "Hola mundo" }
    });

    expect(textarea.value).toBe("Hola mundo");

    expect(screen.getByText(/caracteres restantes/i)).toBeInTheDocument();
  });

  it("permite subir un archivo", () => {
    renderComponent();

    const file = new File(["contenido"], "archivo.txt", {
      type: "text/plain"
    });

    const inputFile = screen.getByLabelText(/Arrastre su archivo aquí/i)
      .closest("label")
      .querySelector("input");

    fireEvent.change(inputFile, {
      target: { files: [file] }
    });

    expect(screen.getByText("archivo.txt")).toBeInTheDocument();
  });

  it("permite eliminar archivo", () => {
    renderComponent();

    const file = new File(["contenido"], "archivo.txt", {
      type: "text/plain"
    });

    const inputFile = document.querySelector(".file-input");

    fireEvent.change(inputFile, {
      target: { files: [file] }
    });

    const eliminarBtn = screen.getByText("eliminar");
    fireEvent.click(eliminarBtn);

    expect(screen.queryByText("archivo.txt")).not.toBeInTheDocument();
  });

  it("maneja drag & drop", () => {
    renderComponent();

    const dropzone = document.querySelector(".file-dropzone");

    fireEvent.dragEnter(dropzone);
    expect(dropzone.classList.contains("active")).toBe(true);

    fireEvent.dragLeave(dropzone);
    expect(dropzone.classList.contains("active")).toBe(false);
  });

  it("limpia el formulario", () => {
    renderComponent();

    const nombre = screen.getByLabelText(/Nombre y apellido/i);
    fireEvent.change(nombre, { target: { value: "Test" } });

    const clearBtn = screen.getByText("Limpiar formulario");
    fireEvent.click(clearBtn);

    expect(nombre.value).toBe("");
  });

  it("envía el formulario", () => {
    renderComponent();

    const consoleSpy = vi.spyOn(console, "log");

    const submitBtn = screen.getByText("Enviar");
    fireEvent.click(submitBtn);

    expect(consoleSpy).toHaveBeenCalled();
  });

});