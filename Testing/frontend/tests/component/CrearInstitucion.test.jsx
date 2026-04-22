import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import CrearInstitucion from "../../src/Pages/Admin/CrearInstitucion";

/* =========================
   MOCKS
========================= */

vi.mock("../../src/Context/AuthContext", () => ({
  useAuth: () => ({
    user: { token: "fake-token" },
  }),
}));

global.fetch = vi.fn();
const onCancelMock = vi.fn();

class MockFileReader {
  constructor() {
    this.result = "data:image/png;base64,test";
  }
  readAsDataURL() {
    setTimeout(() => { if (this.onloadend) this.onloadend(); }, 0);
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, 'alert').mockImplementation(() => {});
  vi.stubGlobal('FileReader', MockFileReader);
});

/* =========================
   TESTS
========================= */

describe("CrearInstitucion", () => {

  it("renderiza correctamente el formulario", () => {
    render(<CrearInstitucion onCancel={onCancelMock} />);
    expect(screen.getByText(/Crear Nueva Institución/i)).toBeInTheDocument();
  });

  it("no permite enviar sin imagen", async () => {
    const { container } = render(<CrearInstitucion onCancel={onCancelMock} />);
    container.querySelector('form').setAttribute('novalidate', 'true');

    const submitBtn = screen.getByRole("button", { name: /Crear Institución/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining("obligatoria")
      );
    });
  });

  it("envía el formulario correctamente", async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uploadUrl: "http://upload-url",
          fileUrl: "http://file-url",
          storageKey: "key123",
        }),
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true });

    const { container } = render(<CrearInstitucion onCancel={onCancelMock} />);

    // 1. Forzamos la desactivación de validación para que JSDOM no bloquee el evento
    const form = container.querySelector('form');
    form.setAttribute('novalidate', 'true');

    // 2. Llenar inputs de texto
    const nombreInput = container.querySelector('input[required][type="text"]');
    const paisInput = screen.getByPlaceholderText(/Ej: Chile/i);
    fireEvent.change(nombreInput, { target: { value: "Institución Test" } });
    fireEvent.change(paisInput, { target: { value: "Chile" } });

    // 3. Llenar Selects de forma INFALIBLE
    const selects = container.querySelectorAll('select');
    selects.forEach(select => {
      // Seleccionamos la primera opción válida (índice 1, ya que el 0 suele ser "Seleccione...")
      const optionValue = select.options[1].value;
      fireEvent.change(select, { target: { value: optionValue } });
    });

    // 4. Llenar Textarea
    fireEvent.change(container.querySelector('textarea'), {
      target: { value: "Descripción de prueba" }
    });

    // 5. Subir Imagen
    const file = new File(["img"], "logo.png", { type: "image/png" });
    const fileInput = container.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // 6. Submit del formulario
    // Usamos el botón directamente pero asegurándonos de disparar el evento submit
    const btnSubmit = screen.getByRole("button", { name: /Crear Institución/i });
    fireEvent.click(btnSubmit);
    fireEvent.submit(form);

    // 7. Verificación con tiempo extendido
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
      expect(onCancelMock).toHaveBeenCalled();
    }, { timeout: 4000 });
  });
  
  it("permite cambiar radios", () => {
    render(<CrearInstitucion onCancel={onCancelMock} />);
    const radioPrivado = screen.getByLabelText(/Privado/i);
    fireEvent.click(radioPrivado);
    expect(radioPrivado.checked).toBe(true);
  });

  it("llama a onCancel al presionar volver", () => {
    render(<CrearInstitucion onCancel={onCancelMock} />);
    fireEvent.click(screen.getByText(/Volver/i));
    expect(onCancelMock).toHaveBeenCalled();
  });
});