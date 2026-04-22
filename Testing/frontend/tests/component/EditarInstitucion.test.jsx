import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import EditarInstitucion from "../../src/Pages/Admin/EditarInstitucion";

/* =========================
   MOCKS
========================= */

vi.mock("../../src/Context/AuthContext", () => ({
  useAuth: () => ({
    user: { token: "fake-token" },
  }),
}));

global.fetch = vi.fn();

class MockFileReader {
  constructor() {
    this.result = "data:image/png;base64,test";
  }
  readAsDataURL() {
    // Simulamos asincronía ligera para que React procese el estado
    setTimeout(() => { if (this.onloadend) this.onloadend(); }, 0);
  }
}

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
    vi.stubGlobal('FileReader', MockFileReader);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it("renderiza correctamente el formulario", () => {
    render(<EditarInstitucion institucion={institucionMock} onCancel={onCancelMock} />);
    expect(screen.getByText(/Editar Institución/i)).toBeInTheDocument();
  });

  it("precarga los datos de la institución", () => {
    render(<EditarInstitucion institucion={institucionMock} onCancel={onCancelMock} />);
    expect(screen.getByDisplayValue("Institución Original")).toBeInTheDocument();
    expect(screen.getByDisplayValue("IO")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Chile")).toBeInTheDocument();
  });

  it("muestra la imagen previa desde la BD", () => {
    render(<EditarInstitucion institucion={institucionMock} onCancel={onCancelMock} />);
    const img = screen.getByAltText(/Previsualización Logo/i);
    expect(img).toBeInTheDocument();
    expect(img.src).toContain("imagen-original.png");
  });

  it("permite modificar inputs", () => {
    render(<EditarInstitucion institucion={institucionMock} onCancel={onCancelMock} />);
    const nombre = screen.getByDisplayValue("Institución Original");
    fireEvent.change(nombre, { target: { value: "Nuevo Nombre" } });
    expect(nombre.value).toBe("Nuevo Nombre");
  });

  it("convierte sigla a mayúsculas", () => {
    render(<EditarInstitucion institucion={institucionMock} onCancel={onCancelMock} />);
    const sigla = screen.getByDisplayValue("IO");
    fireEvent.change(sigla, { target: { value: "abc" } });
    expect(sigla.value).toBe("ABC");
  });

  it("permite cambiar radios", () => {
    render(<EditarInstitucion institucion={institucionMock} onCancel={onCancelMock} />);
    const radioPrivado = screen.getByLabelText(/Privado/i);
    fireEvent.click(radioPrivado);
    expect(radioPrivado.checked).toBe(true);
  });

  it("permite subir una nueva imagen (preview)", async () => {
    const { container } = render(<EditarInstitucion institucion={institucionMock} onCancel={onCancelMock} />);
    const file = new File(["img"], "nuevo.png", { type: "image/png" });
    const input = container.querySelector('input[type="file"]');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      const img = screen.getByAltText(/Previsualización Logo/i);
      expect(img.src).toContain("base64,test");
    });
  });

  it("envía el formulario sin imagen nueva (solo PUT)", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { container } = render(<EditarInstitucion institucion={institucionMock} onCancel={onCancelMock} />);
    const form = container.querySelector('form');
    form.setAttribute('novalidate', 'true');

    fireEvent.submit(form);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/instituciones/1"),
        expect.objectContaining({ method: "PUT" })
      );
      expect(onCancelMock).toHaveBeenCalled();
    });
  });

  it("envía el formulario con nueva imagen (flujo completo)", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ uploadUrl: "u", fileUrl: "f", storageKey: "k" }) })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true });

    const { container } = render(<EditarInstitucion institucion={institucionMock} onCancel={onCancelMock} />);
    const form = container.querySelector('form');
    form.setAttribute('novalidate', 'true');

    const file = new File(["img"], "nuevo.png", { type: "image/png" });
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.submit(form);

    await waitFor(() => {
      // Usamos toBeGreaterThanOrEqual por si hay efectos secundarios que disparen fetch extra
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(onCancelMock).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it("llama a onCancel al presionar volver", () => {
    render(<EditarInstitucion institucion={institucionMock} onCancel={onCancelMock} />);
    fireEvent.click(screen.getByText(/Volver/i));
    expect(onCancelMock).toHaveBeenCalled();
  });
});