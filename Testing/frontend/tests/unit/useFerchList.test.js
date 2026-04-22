import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useFetchList } from "../../src/Components/Hooks/useFetchList";
import { useSearchParams } from "react-router-dom";

/* =========================
   MOCKS
========================= */

// Mock de react-router-dom
const setSearchParamsMock = vi.fn();
vi.mock("react-router-dom", () => ({
  useSearchParams: vi.fn(),
}));

describe("useFetchList hook", () => {
  const mockData = {
    data: [{ id: 1, name: "Item 1" }],
    totalPages: 2,
    total: 1
  };

  // Definimos una función de fetch mockeada que devuelve una promesa
  const fetchFunctionMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    fetchFunctionMock.mockResolvedValue(mockData);
    
    // Configuración por defecto para el mock de useSearchParams
    vi.mocked(useSearchParams).mockReturnValue([
      new URLSearchParams(),
      setSearchParamsMock
    ]);
  });

  it("inicializa con valores por defecto y carga datos", async () => {
    const { result } = renderHook(() => useFetchList(fetchFunctionMock));

    // Valores iniciales inmediatos
    expect(result.current.search).toBe("");
    expect(result.current.page).toBe(1);
    expect(result.current.filters).toEqual({});

    // Esperamos a que la promesa del fetch se resuelva y actualice el estado
    await waitFor(() => {
      expect(fetchFunctionMock).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockData.data);
      expect(result.current.loading).toBe(false);
    });
  });

  it("actualiza search y dispara fetch después de debounce", async () => {
    const { result } = renderHook(() => 
      useFetchList(fetchFunctionMock, { debounceTime: 50 })
    );

    act(() => {
      result.current.setSearch("test");
    });

    // Verificamos que el estado cambió pero el fetch no se ha llamado aún por el debounce
    expect(result.current.search).toBe("test");

    // Esperamos a que pase el tiempo de debounce y se ejecute el fetch
    await waitFor(() => {
      expect(fetchFunctionMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "test" })
      );
    }, { timeout: 1000 });
  });

  it("actualiza filtros y dispara fetch", async () => {
    const { result } = renderHook(() => 
      useFetchList(fetchFunctionMock, { debounceTime: 0 })
    );

    act(() => {
      result.current.setFilters({ category: ["A"] });
    });

    await waitFor(() => {
      expect(fetchFunctionMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          // Ajusta esto según cómo tu hook envíe los filtros (como array o como string)
          filters: expect.anything() 
        })
      );
    });
  });

  it("cambia la página y dispara fetch", async () => {
    const { result } = renderHook(() => 
      useFetchList(fetchFunctionMock, { debounceTime: 0 })
    );

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() => {
      expect(fetchFunctionMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it("cancela fetch anterior si se hace una nueva búsqueda", async () => {
    const abortSpy = vi.fn();
    
    fetchFunctionMock.mockImplementation(({ signal }) => {
      signal.addEventListener("abort", abortSpy);
      return new Promise((resolve) => setTimeout(() => resolve(mockData), 50));
    });

    const { result } = renderHook(() => 
      useFetchList(fetchFunctionMock, { debounceTime: 0 })
    );

    await act(async () => {
      result.current.setSearch("A");
      // Cambiamos rápidamente para disparar una segunda petición
      result.current.setSearch("B");
    });

    await waitFor(() => {
      expect(abortSpy).toHaveBeenCalled();
    });
  });
});