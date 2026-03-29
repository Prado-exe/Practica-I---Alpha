import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EditarInstitucion from "../../src/Pages/Admin/EditarInstitucion";

/* =========================
   MOCKS
========================= */

// Auth mock
vi.mock("../../Context/AuthContext", () => ({
  useAuth: () => ({
    user: { token: "fake-token" },
  }),
}));

// fetch mock
global.fetch = vi.fn();

/* =========================
   DATA MOCK
========================= */

const institucionMock = {
  institution_id: 1,
  legal_name: "Institución Original",
  short_name: "IO",
  institution_type: "ONG",
  country_name: "Chile",
  description: "Descripción original",
  data_role: "Generador",
  access_level: "public",
  institution_status: "active",
  logo_url: "http://imagen-original.png",
};

/* =========================
   TESTS
========================= */

describe("EditarInstitucion", () => {
  const onCancelMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza correctamente el formulario", () => {
    render(<EditarInstitucion institucion={institucionMock} onCancel={onCancelMock} />);

    expect(screen.getByText("Editar Institución")).toBeInTheDocument();
    expect(screen.getByText("Actualizar la información de la entidad.")).toBeInTheDocument();
  });

  it("precarga los datos de la institución", async () => {
    render(<EditarInstitucion institucion={institucionMock} onCancel={onCancelMock} />);

    expect(await screen.findByDisplayValue("Institución Original")).toBeInTheDocument();
    expect(screen.getByDisplayValue("IO")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Chile")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Descripción original")).toBeInTheDocument();
  });

  it("muestra la imagen previa desde la BD", async () => {
    render(<EditarInstitucion institucion={institucionMock} onCancel={onCancelMock} />);

    const img = await screen.findByAltText("Previsualización Logo");
    expect(img).toBeInTheDocument();
    expect(img.src).toContain("imagen-original.png");
  });

  it("permite modificar inputs", async () => {
    render(<EditarInstitucion institucion={institucionMock} onCancel={onCancelMock} />);

    const nombre = await screen.findByDisplayValue("Institución Original");

    fireEvent.change(nombre, {
      target: { value: "Nuevo Nombre" },
    });

    expect(nombre.value).toBe("Nuevo Nombre");
  });

  it("convierte sigla a mayúsculas", async () => {
    render(<EditarInstitucion institucion={institucionMock} onCancel={onCancelMock} />);

    const sigla = await screen.findByDisplayValue("IO");

    fireEvent.change(sigla, {
      target: { value: "abc" },
    });

    expect(sigla.value).toBe("ABC");
  });

  it("permite cambiar radios", () => {
    render(<EditarInstitucion institucion={institucionMock} onCancel={onCancelMock} />);

    const privado = screen.getByLabelText(/Privado/i);
    fireEvent.click(privado);

    expect(privado.checked).toBe(true);
  });

  it("permite subir una nueva imagen (preview)", async () => {
    render(<EditarInstitucion institucion={institucionMock} onCancel={onCancelMock} />);

    const file = new File(["img"], "nuevo.png", { type: "image/png" });

    // mock FileReader
    const mockRead = vi.fn();
    global.FileReader = vi.fn(() => ({
      readAsDataURL: mockRead,
      onloadend: null,
      result: "data:image/png;base64,test",
    }));

    const input = screen.getByLabelText(/logo institucional/i);

    fireEvent.change(input, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(mockRead).toHaveBeenCalled();
    });
  });

  it("envía el formulario sin imagen nueva (solo PUT)", async () => {
    window.alert = vi.fn();

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<EditarInstitucion institucion={institucionMock} onCancel={onCancelMock} />);

    fireEvent.click(screen.getByText("Guardar Cambios"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/instituciones/1"),
        expect.objectContaining({
          method: "PUT",
        })
      );

      expect(onCancelMock).toHaveBeenCalled();
    });
  });

  it("envía el formulario con nueva imagen (flujo completo)", async () => {
    window.alert = vi.fn();

    // 1. presigned
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uploadUrl: "http://upload-url",
          fileUrl: "http://file-url",
          storageKey: "key123",
        }),
      })
      // 2. upload PUT
      .mockResolvedValueOnce({
        ok: true,
      })
      // 3. PUT final
      .mockResolvedValueOnce({
        ok: true,
      });

    render(<EditarInstitucion institucion={institucionMock} onCancel={onCancelMock} />);

    const file = new File(["img"], "nuevo.png", { type: "image/png" });

    const input = screen.getByLabelText(/logo institucional/i);

    fireEvent.change(input, {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByText("Guardar Cambios"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(onCancelMock).toHaveBeenCalled();
    });
  });

  it("llama a onCancel al presionar volver", () => {
    render(<EditarInstitucion institucion={institucionMock} onCancel={onCancelMock} />);

    fireEvent.click(screen.getByText("← Volver"));

    expect(onCancelMock).toHaveBeenCalled();
  });
});