import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import SearchBar from "../../src/Components/Common/SearchBar";
import "@testing-library/jest-dom/vitest";

// Mocks de CSS para evitar errores de resolución
vi.mock("../../src/Styles/Component_styles/SearchBar.css", () => ({}));
vi.mock("../../Styles/Component_styles/SearchBar.css", () => ({}));

describe("SearchBar", () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("renderiza el input con placeholder", () => {
    render(<SearchBar placeholder="Buscar algo..." />);
    expect(screen.getByPlaceholderText("Buscar algo...")).toBeInTheDocument();
  });

  test("permite escribir en el input", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const input = screen.getByRole("textbox");
    await user.type(input, "hola");
    expect(input).toHaveValue("hola");
  });

  test("muestra y limpia el input al hacer click en limpiar", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const input = screen.getByRole("textbox");
    await user.type(input, "hola");

    const clearBtn = screen.getByLabelText(/limpiar/i);
    await user.click(clearBtn);
    expect(input).toHaveValue("");
  });

  /* =========================
     PRUEBAS DE DEBOUNCE (Usando fireEvent para evitar Timeouts)
     ========================= */

test("llama a onSearch después del debounce", async () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} debounceTime={300} />);
    
    // ✅ TRUCO: Limpiamos cualquier llamada accidental durante el montaje (el string vacío)
    onSearch.mockClear();

    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "hola" } });

    // Verificamos que no se llame inmediatamente tras el cambio
    expect(onSearch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearch).toHaveBeenCalledWith("hola");
  });

  test("solo ejecuta onSearch una vez tras múltiples cambios rápidos", async () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} debounceTime={300} />);
    
    // ✅ Limpiamos llamadas del primer render
    onSearch.mockClear();

    const input = screen.getByRole("textbox");

    // Cambios rápidos
    fireEvent.change(input, { target: { value: "h" } });
    fireEvent.change(input, { target: { value: "ho" } });
    fireEvent.change(input, { target: { value: "hola" } });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Ahora sí, debería ser exactamente 1 vez (la de "hola")
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("hola");
  });

test("solo ejecuta onSearch una vez tras múltiples cambios rápidos", async () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    
    render(<SearchBar onSearch={onSearch} debounceTime={300} />);
    
    // ✅ CLAVE: Limpiamos el mock para ignorar la llamada automática del montaje
    onSearch.mockClear();

    const input = screen.getByRole("textbox");

    // Simulamos escritura rápida
    fireEvent.change(input, { target: { value: "h" } });
    fireEvent.change(input, { target: { value: "ho" } });
    fireEvent.change(input, { target: { value: "hola" } });

    // Avanzamos el tiempo del debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Ahora sí, debe ser exactamente 1
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("hola");
    
    vi.useRealTimers();
  });

  test("no falla si onSearch no está definido", async () => {
    // Aquí no usamos FakeTimers para que userEvent funcione normal
    const user = userEvent.setup();
    render(<SearchBar />);
    const input = screen.getByRole("textbox");
    await user.type(input, "test");
    expect(input).toHaveValue("test");
  });
}); 