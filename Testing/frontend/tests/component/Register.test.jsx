import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Register from "../../src/Pages/Register";
import { BrowserRouter } from "react-router-dom";

// 👇 Mock de navigate
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// 👇 Mock fetch global
global.fetch = vi.fn();

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <Register />
    </BrowserRouter>
  );
};

describe("Register", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza correctamente el formulario", () => {
    renderComponent();

    expect(screen.getByLabelText("Nombre completo")).toBeInTheDocument();
    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar contraseña")).toBeInTheDocument();
    expect(screen.getByText("Registrarse")).toBeInTheDocument();
  });

  it("permite escribir en los inputs", () => {
    renderComponent();

    fireEvent.change(screen.getByLabelText("Nombre completo"), {
      target: { value: "Juan Pérez" }
    });

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "test@mail.com" }
    });

    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "123456" }
    });

    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "123456" }
    });

    expect(screen.getByDisplayValue("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByDisplayValue("test@mail.com")).toBeInTheDocument();
  });

  it("muestra error si las contraseñas no coinciden", async () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    renderComponent();

    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "123456" }
    });

    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "654321" }
    });

    fireEvent.click(screen.getByText("Registrarse"));

    expect(alertMock).toHaveBeenCalledWith("Las contraseñas no coinciden");
  });

  it("envía el formulario correctamente y navega", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "ok" })
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText("Nombre completo"), {
      target: { value: "Juan Pérez" }
    });

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "test@mail.com" }
    });

    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "123456" }
    });

    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "123456" }
    });

    fireEvent.click(screen.getByText("Registrarse"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/register"),
      expect.objectContaining({
        method: "POST"
      })
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/verificacion", {
        state: { email: "test@mail.com" }
      });
    });
  });

  it("muestra estado loading", async () => {
    fetch.mockImplementationOnce(() =>
      new Promise((resolve) =>
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({})
        }), 100)
      )
    );

    renderComponent();

    fireEvent.change(screen.getByLabelText("Nombre completo"), {
      target: { value: "Juan Pérez" }
    });

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "test@mail.com" }
    });

    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "123456" }
    });

    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "123456" }
    });

    fireEvent.click(screen.getByText("Registrarse"));

    expect(screen.getByText("Registrando...")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  it("maneja error del backend", async () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Error en registro" })
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText("Nombre completo"), {
      target: { value: "Juan Pérez" }
    });

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "test@mail.com" }
    });

    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "123456" }
    });

    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "123456" }
    });

    fireEvent.click(screen.getByText("Registrarse"));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Error en registro");
    });
  });

});