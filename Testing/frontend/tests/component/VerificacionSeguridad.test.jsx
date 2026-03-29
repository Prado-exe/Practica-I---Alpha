import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Verificacion_de_seguridad from "../../src/Pages/VerificacionSeguridad";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// 👇 mock navigate
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// 👇 mock fetch
global.fetch = vi.fn();

// Helper para pasar state (email)
const renderComponent = () => {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/verificacion",
          state: { email: "test@mail.com" }
        }
      ]}
    >
      <Routes>
        <Route path="/verificacion" element={<Verificacion_de_seguridad />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("Verificacion_de_seguridad", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza correctamente con email", () => {
    renderComponent();

    expect(screen.getByText("Verificación de seguridad")).toBeInTheDocument();
    expect(screen.getByText(/test@mail.com/)).toBeInTheDocument();
  });

  it("permite escribir el código", () => {
    renderComponent();

    const input = screen.getByPlaceholderText("Ingresa el código");

    fireEvent.change(input, { target: { value: "123456" } });

    expect(input.value).toBe("123456");
  });

  it("envía el código correctamente y navega", async () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true })
    });

    renderComponent();

    const input = screen.getByPlaceholderText("Ingresa el código");

    fireEvent.change(input, { target: { value: "123456" } });
    fireEvent.click(screen.getByText("Verificar"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/verificar"),
      expect.objectContaining({
        method: "POST"
      })
    );

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(
        "Cuenta verificada con éxito. Por favor, inicia sesión."
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("muestra error si backend falla", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Código inválido" })
    });

    renderComponent();

    const input = screen.getByPlaceholderText("Ingresa el código");

    fireEvent.change(input, { target: { value: "000000" } });
    fireEvent.click(screen.getByText("Verificar"));

    await waitFor(() => {
      expect(screen.getByText("Código inválido")).toBeInTheDocument();
    });
  });

  it("maneja error de red", async () => {
    fetch.mockRejectedValueOnce(new Error("Network error"));

    renderComponent();

    const input = screen.getByPlaceholderText("Ingresa el código");

    fireEvent.change(input, { target: { value: "123456" } });
    fireEvent.click(screen.getByText("Verificar"));

    await waitFor(() => {
      expect(
        screen.getByText("Error de conexión con el servidor")
      ).toBeInTheDocument();
    });
  });

});