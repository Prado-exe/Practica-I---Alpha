import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ResetPassword from "../../src/Pages/ResetPassword";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock fetch global
global.fetch = vi.fn();

// Helper para render con query params (?token=123) y devolver el contenedor
const renderComponent = () => {
  return render(
    <MemoryRouter initialEntries={["/reset-password?token=123"]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("ResetPassword", () => {

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks(); // Limpia espías como el de alert
  });

  it("renderiza el formulario correctamente", () => {
    renderComponent();

    // Usamos getByRole para el título para evitar conflicto con el <label>
    expect(screen.getByRole("heading", { name: /nueva contraseña/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /actualizar contraseña/i })).toBeInTheDocument();
  });

  it("permite escribir en los inputs", () => {
    // Extraemos el 'container' del render para buscar los inputs manualmente
    const { container } = renderComponent();

    const inputs = container.querySelectorAll('input[type="password"]');
    const passwordInput = inputs[0];
    const confirmInput = inputs[1];

    fireEvent.change(passwordInput, { target: { value: "12345678" } });
    fireEvent.change(confirmInput, { target: { value: "12345678" } });

    expect(passwordInput.value).toBe("12345678");
    expect(confirmInput.value).toBe("12345678");
  });

  it("muestra alert si contraseñas no coinciden", () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    const { container } = renderComponent();

    const inputs = container.querySelectorAll('input[type="password"]');
    const passwordInput = inputs[0];
    const confirmInput = inputs[1];

    fireEvent.change(passwordInput, { target: { value: "12345678" } });
    fireEvent.change(confirmInput, { target: { value: "87654321" } });

    fireEvent.click(screen.getByRole("button", { name: /actualizar contraseña/i }));

    expect(alertMock).toHaveBeenCalledWith("Las contraseñas no coinciden");
  });

  it("muestra error si contraseña es muy corta", () => {
    const { container } = renderComponent();

    const inputs = container.querySelectorAll('input[type="password"]');
    const passwordInput = inputs[0];
    const confirmInput = inputs[1];

    fireEvent.change(passwordInput, { target: { value: "123" } });
    fireEvent.change(confirmInput, { target: { value: "123" } });

    fireEvent.click(screen.getByRole("button", { name: /actualizar contraseña/i }));

    expect(screen.getByText(/la contraseña debe tener al menos 8 caracteres/i)).toBeInTheDocument();
  });

  it("envía correctamente y muestra success", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true })
    });

    const { container } = renderComponent();

    const inputs = container.querySelectorAll('input[type="password"]');
    const passwordInput = inputs[0];
    const confirmInput = inputs[1];

    fireEvent.change(passwordInput, { target: { value: "12345678" } });
    fireEvent.change(confirmInput, { target: { value: "12345678" } });

    fireEvent.click(screen.getByRole("button", { name: /actualizar contraseña/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/reset-password"),
        expect.objectContaining({
          method: "POST"
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/contraseña actualizada/i)).toBeInTheDocument();
    });
  });

  it("muestra loading mientras envía", async () => {
    fetch.mockImplementationOnce(() =>
      new Promise((resolve) =>
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ ok: true })
        }), 50)
      )
    );

    const { container } = renderComponent();

    const inputs = container.querySelectorAll('input[type="password"]');
    const passwordInput = inputs[0];
    const confirmInput = inputs[1];

    fireEvent.change(passwordInput, { target: { value: "12345678" } });
    fireEvent.change(confirmInput, { target: { value: "12345678" } });

    fireEvent.click(screen.getByRole("button", { name: /actualizar contraseña/i }));

    expect(screen.getByText(/actualizando/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/contraseña actualizada/i)).toBeInTheDocument();
    });
  });

  it("muestra error del backend", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Token inválido" })
    });

    const { container } = renderComponent();

    const inputs = container.querySelectorAll('input[type="password"]');
    const passwordInput = inputs[0];
    const confirmInput = inputs[1];

    fireEvent.change(passwordInput, { target: { value: "12345678" } });
    fireEvent.change(confirmInput, { target: { value: "12345678" } });

    fireEvent.click(screen.getByRole("button", { name: /actualizar contraseña/i }));

    await waitFor(() => {
      expect(screen.getByText(/token inválido/i)).toBeInTheDocument();
    });
  });

  it("maneja error de red", async () => {
    fetch.mockRejectedValueOnce(new Error("Network error"));

    const { container } = renderComponent();

    const inputs = container.querySelectorAll('input[type="password"]');
    const passwordInput = inputs[0];
    const confirmInput = inputs[1];

    fireEvent.change(passwordInput, { target: { value: "12345678" } });
    fireEvent.change(confirmInput, { target: { value: "12345678" } });

    fireEvent.click(screen.getByRole("button", { name: /actualizar contraseña/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/error de conexión con el servidor/i)
      ).toBeInTheDocument();
    });
  });
});