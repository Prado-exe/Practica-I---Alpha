import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ResetPassword from "../../src/Pages/ResetPassword";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock fetch
global.fetch = vi.fn();

// Helper para render con query params (?token=123)
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
  });

  it("renderiza el formulario correctamente", () => {
    renderComponent();

    expect(screen.getByText("Nueva contraseña")).toBeInTheDocument();
    expect(screen.getByText("Actualizar contraseña")).toBeInTheDocument();
  });

  it("permite escribir en los inputs", () => {
    renderComponent();

    const inputs = screen.getAllByRole("textbox", { hidden: true });

    fireEvent.change(inputs[0], { target: { value: "12345678" } });
    fireEvent.change(inputs[1], { target: { value: "12345678" } });

    expect(inputs[0].value).toBe("12345678");
    expect(inputs[1].value).toBe("12345678");
  });

  it("muestra alert si contraseñas no coinciden", () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    renderComponent();

    const inputs = screen.getAllByRole("textbox", { hidden: true });

    fireEvent.change(inputs[0], { target: { value: "12345678" } });
    fireEvent.change(inputs[1], { target: { value: "87654321" } });

    fireEvent.click(screen.getByText("Actualizar contraseña"));

    expect(alertMock).toHaveBeenCalledWith("Las contraseñas no coinciden");
  });

  it("muestra error si contraseña es muy corta", () => {
    renderComponent();

    const inputs = screen.getAllByRole("textbox", { hidden: true });

    fireEvent.change(inputs[0], { target: { value: "123" } });
    fireEvent.change(inputs[1], { target: { value: "123" } });

    fireEvent.click(screen.getByText("Actualizar contraseña"));

    expect(screen.getByText("La contraseña debe tener al menos 8 caracteres.")).toBeInTheDocument();
  });

  it("envía correctamente y muestra success", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true })
    });

    renderComponent();

    const inputs = screen.getAllByRole("textbox", { hidden: true });

    fireEvent.change(inputs[0], { target: { value: "12345678" } });
    fireEvent.change(inputs[1], { target: { value: "12345678" } });

    fireEvent.click(screen.getByText("Actualizar contraseña"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/reset-password"),
      expect.objectContaining({
        method: "POST"
      })
    );

    await waitFor(() => {
      expect(screen.getByText("Contraseña actualizada")).toBeInTheDocument();
    });
  });

  it("muestra loading mientras envía", async () => {
    fetch.mockImplementationOnce(() =>
      new Promise((resolve) =>
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ ok: true })
        }), 100)
      )
    );

    renderComponent();

    const inputs = screen.getAllByRole("textbox", { hidden: true });

    fireEvent.change(inputs[0], { target: { value: "12345678" } });
    fireEvent.change(inputs[1], { target: { value: "12345678" } });

    fireEvent.click(screen.getByText("Actualizar contraseña"));

    expect(screen.getByText("Actualizando...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Contraseña actualizada")).toBeInTheDocument();
    });
  });

  it("muestra error del backend", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Token inválido" })
    });

    renderComponent();

    const inputs = screen.getAllByRole("textbox", { hidden: true });

    fireEvent.change(inputs[0], { target: { value: "12345678" } });
    fireEvent.change(inputs[1], { target: { value: "12345678" } });

    fireEvent.click(screen.getByText("Actualizar contraseña"));

    await waitFor(() => {
      expect(screen.getByText("Token inválido")).toBeInTheDocument();
    });
  });

  it("maneja error de red", async () => {
    fetch.mockRejectedValueOnce(new Error("Network error"));

    renderComponent();

    const inputs = screen.getAllByRole("textbox", { hidden: true });

    fireEvent.change(inputs[0], { target: { value: "12345678" } });
    fireEvent.change(inputs[1], { target: { value: "12345678" } });

    fireEvent.click(screen.getByText("Actualizar contraseña"));

    await waitFor(() => {
      expect(
        screen.getByText("Error de conexión con el servidor. Intente más tarde.")
      ).toBeInTheDocument();
    });
  });

});