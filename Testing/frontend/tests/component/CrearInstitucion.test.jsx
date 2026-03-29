import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CrearInstitucion from "../../src/Pages/Admin/CrearInstitucion";

/* =========================
   MOCKS
========================= */

// Mock Auth
vi.mock("../../Context/AuthContext", () => ({
  useAuth: () => ({
    user: { token: "fake-token" },
  }),
}));

// Mock fetch global
global.fetch = vi.fn();

/* =========================
   SETUP
========================= */

const onCancelMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

/* =========================
   TESTS
========================= */

describe("CrearInstitucion", () => {

  it("renderiza correctamente el formulario", () => {
    render(<CrearInstitucion onCancel={onCancelMock} />);

    expect(screen.getByText("Crear Nueva Institución")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre oficial *")).toBeInTheDocument();
    expect(screen.getByLabelText("País *")).toBeInTheDocument();
  });

  it("permite escribir en los inputs", () => {
    render(<CrearInstitucion onCancel={onCancelMock} />);

    const nombre = screen.getByLabelText("Nombre oficial *");

    fireEvent.change(nombre, { target: { value: "Mi Institución" } });

    expect(nombre.value).toBe("Mi Institución");
  });

  it("convierte la sigla a mayúsculas", () => {
    render(<CrearInstitucion onCancel={onCancelMock} />);

    const sigla = screen.getByLabelText("Sigla / Acrónimo");

    fireEvent.change(sigla, { target: { value: "abc" } });

    expect(sigla.value).toBe("ABC");
  });

  it("muestra preview al subir imagen", async () => {
    render(<CrearInstitucion onCancel={onCancelMock} />);

    const file = new File(["img"], "logo.png", { type: "image/png" });

    const input = screen.getByLabelText(/logo institucional/i);

    // mock FileReader
    const mockRead = vi.fn();
    global.FileReader = vi.fn(() => ({
      readAsDataURL: mockRead,
      onloadend: null,
      result: "data:image/png;base64,test",
    }));

    fireEvent.change(input, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(mockRead).toHaveBeenCalled();
    });
  });

  it("no permite enviar sin imagen", () => {
    window.alert = vi.fn();

    render(<CrearInstitucion onCancel={onCancelMock} />);

    const submit = screen.getByText("Crear Institución");
    fireEvent.click(submit);

    expect(window.alert).toHaveBeenCalledWith(
      "La imagen de la institución es obligatoria."
    );
  });

  it("permite cambiar radios", () => {
    render(<CrearInstitucion onCancel={onCancelMock} />);

    const privado = screen.getByLabelText(/Privado/i);
    fireEvent.click(privado);

    expect(privado.checked).toBe(true);
  });

  it("llama a onCancel al presionar volver", () => {
    render(<CrearInstitucion onCancel={onCancelMock} />);

    fireEvent.click(screen.getByText("← Volver"));

    expect(onCancelMock).toHaveBeenCalled();
  });

  it("envía el formulario correctamente", async () => {
    window.alert = vi.fn();

    // mock flujo completo
    fetch
      // presigned URL
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uploadUrl: "http://upload-url",
          fileUrl: "http://file-url",
          storageKey: "key123",
        }),
      })
      // upload PUT
      .mockResolvedValueOnce({
        ok: true,
      })
      // POST final
      .mockResolvedValueOnce({
        ok: true,
      });

    render(<CrearInstitucion onCancel={onCancelMock} />);

    // llenar formulario
    fireEvent.change(screen.getByLabelText("Nombre oficial *"), {
      target: { value: "Institución Test" },
    });

    fireEvent.change(screen.getByLabelText("Tipo de Institución *"), {
      target: { value: "ONG" },
    });

    fireEvent.change(screen.getByLabelText("País *"), {
      target: { value: "Chile" },
    });

    fireEvent.change(screen.getByLabelText("Rol respecto a los datos *"), {
      target: { value: "Generador" },
    });

    fireEvent.change(screen.getByLabelText("Descripción Institucional *"), {
      target: { value: "Descripción de prueba" },
    });

    // mock imagen
    const file = new File(["img"], "logo.png", { type: "image/png" });

    const input = screen.getByLabelText(/logo institucional/i);

    fireEvent.change(input, {
      target: { files: [file] },
    });

    // submit
    fireEvent.click(screen.getByText("Crear Institución"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
      expect(onCancelMock).toHaveBeenCalled();
    });
  });
});