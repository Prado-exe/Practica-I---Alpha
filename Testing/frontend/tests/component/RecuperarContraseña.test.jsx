import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RecuperarContrasena from "../../src/Pages/RecuperarContrasena";
import { BrowserRouter } from "react-router-dom";

// Mock global fetch
global.fetch = vi.fn();

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <RecuperarContrasena />
    </BrowserRouter>
  );
};

describe("RecuperarContrasena", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza el formulario correctamente", () => {
    renderComponent();

    expect(screen.getByText("Recuperar contraseña")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("correo@ejemplo.cl")).toBeInTheDocument();
    expect(screen.getByText("Enviar enlace de recuperación")).toBeInTheDocument();
  });

  it("permite escribir en el input de email", () => {
    renderComponent();

    const input = screen.getByPlaceholderText("correo@ejemplo.cl");

    fireEvent.change(input, { target: { value: "test@mail.com" } });

    expect(input.value).toBe("test@mail.com");
  });

  it("envía el formulario correctamente y cambia a estado 'sent'", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "ok" })
    });

    renderComponent();

    const input = screen.getByPlaceholderText("correo@ejemplo.cl");
    const button = screen.getByText("Enviar enlace de recuperación");

    fireEvent.change(input, { target: { value: "test@mail.com" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/recuperar-password"),
      expect.objectContaining({
        method: "POST"
      })
    );

    await waitFor(() => {
      expect(screen.getByText("Correo enviado")).toBeInTheDocument();
    });
  });

  it("muestra estado loading mientras envía", async () => {
    fetch.mockImplementationOnce(() =>
      new Promise((resolve) =>
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({})
        }), 100)
      )
    );

    renderComponent();

    const input = screen.getByPlaceholderText("correo@ejemplo.cl");
    const button = screen.getByText("Enviar enlace de recuperación");

    fireEvent.change(input, { target: { value: "test@mail.com" } });
    fireEvent.click(button);

    expect(screen.getByText("Enviando...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Correo enviado")).toBeInTheDocument();
    });
  });

  it("permite reenviar el correo", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({})
    });

    renderComponent();

    const input = screen.getByPlaceholderText("correo@ejemplo.cl");
    fireEvent.change(input, { target: { value: "test@mail.com" } });

    fireEvent.click(screen.getByText("Enviar enlace de recuperación"));

    await waitFor(() => {
      expect(screen.getByText("Correo enviado")).toBeInTheDocument();
    });

    const resendBtn = screen.getByText("Reenviar correo");
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

});