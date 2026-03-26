import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import SearchBar from "../../src/Components/Common/SearchBar";
import "@testing-library/jest-dom/vitest";

// 🔥 mock del CSS (corrige ruta si es necesario)
vi.mock("../../Styles/Component_styles/SearchBar.css", () => ({}));

describe("SearchBar", () => {

  // 🔹 Render básico
  test("renderiza el input con placeholder", () => {
    render(<SearchBar placeholder="Buscar algo..." />);
    
    expect(screen.getByPlaceholderText("Buscar algo...")).toBeInTheDocument();
  });

  // 🔹 Escribir en input
  test("permite escribir en el input", async () => {
    const user = userEvent.setup(); // 🔥 IMPORTANTE

    render(<SearchBar />);
    const input = screen.getByRole("textbox");

    await user.type(input, "hola");

    expect(input).toHaveValue("hola");
  });

  // 🔹 Botón limpiar
  test("muestra y limpia el input al hacer click en limpiar", async () => {
    const user = userEvent.setup();

    render(<SearchBar />);
    const input = screen.getByRole("textbox");

    await user.type(input, "hola");

    const clearBtn = screen.getByLabelText("Limpiar búsqueda");
    expect(clearBtn).toBeInTheDocument();

    await user.click(clearBtn);

    expect(input).toHaveValue("");
  });

  // 🔹 No muestra botón limpiar si está vacío
  test("no muestra el botón limpiar cuando el input está vacío", () => {
    render(<SearchBar />);
    
    expect(screen.queryByLabelText("Limpiar búsqueda")).not.toBeInTheDocument();
  });

  // 🔥 Debounce básico (CORREGIDO)
  test("llama a onSearch después del debounce", async () => {
    vi.useFakeTimers();

    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime, // 🔥 clave
    });

    const onSearch = vi.fn();

    render(<SearchBar onSearch={onSearch} debounceTime={300} />);
    const input = screen.getByRole("textbox");

    await user.type(input, "hola");

    // antes del debounce
    expect(onSearch).not.toHaveBeenCalled();

    // avanzar tiempo correctamente
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearch).toHaveBeenCalledWith("hola");

    vi.useRealTimers();
  });

  // 🔥 Debounce con múltiples cambios
  test("solo ejecuta onSearch una vez tras múltiples cambios rápidos", async () => {
    vi.useFakeTimers();

    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });

    const onSearch = vi.fn();

    render(<SearchBar onSearch={onSearch} debounceTime={300} />);
    const input = screen.getByRole("textbox");

    await user.type(input, "hola");

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("hola");

    vi.useRealTimers();
  });

  // 🔹 No rompe si onSearch no existe
  test("no falla si onSearch no está definido", async () => {
    const user = userEvent.setup();

    render(<SearchBar />);
    const input = screen.getByRole("textbox");

    await user.type(input, "hola");

    expect(input).toHaveValue("hola");
  });

});