// useFetchList.test.jsx
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useFetchList } from "./useFetchList";
import { useSearchParams } from "react-router-dom";

// 🔹 Mock de useSearchParams
const setSearchParamsMock = vi.fn();
vi.mock("react-router-dom", () => ({
  useSearchParams: () => [{ get: vi.fn(() => null) }, setSearchParamsMock],
}));

describe("useFetchList hook", () => {

  const mockData = {
    data: [{ id: 1, name: "Item 1" }],
    totalPages: 2,
    total: 1
  };

  const fetchFunctionMock = vi.fn(() => Promise.resolve(mockData));

  it("inicializa con valores por defecto", async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchList(fetchFunctionMock)
    );

    expect(result.current.search).toBe("");
    expect(result.current.page).toBe(1);
    expect(result.current.filters).toEqual({});
    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);

    await waitForNextUpdate(); // espera el primer fetch

    expect(fetchFunctionMock).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockData.data);
    expect(result.current.totalPages).toBe(mockData.totalPages);
    expect(result.current.totalResults).toBe(mockData.total);
    expect(result.current.loading).toBe(false);
  });

  it("actualiza search y dispara fetch después de debounce", async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchList(fetchFunctionMock, { debounceTime: 50 })
    );

    act(() => {
      result.current.setSearch("test");
    });

    // Debounce espera 50ms antes de disparar fetch
    await new Promise((r) => setTimeout(r, 60));
    await waitForNextUpdate();

    expect(fetchFunctionMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "test" })
    );
  });

  it("actualiza filtros y dispara fetch", async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchList(fetchFunctionMock, { debounceTime: 0 })
    );

    act(() => {
      result.current.setFilters({ category: ["A"] });
    });

    await waitForNextUpdate();

    expect(fetchFunctionMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filters: { category: "A" }
      })
    );
  });

  it("cambia la página y dispara fetch", async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchList(fetchFunctionMock, { debounceTime: 0 })
    );

    act(() => {
      result.current.setPage(2);
    });

    await waitForNextUpdate();

    expect(fetchFunctionMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 })
    );
  });

  it("cancelar fetch anterior si se hace una nueva búsqueda", async () => {
    const abortSpy = vi.fn();
    fetchFunctionMock.mockImplementation(({ signal }) => {
      signal.addEventListener("abort", abortSpy);
      return new Promise((resolve) => setTimeout(() => resolve(mockData), 50));
    });

    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchList(fetchFunctionMock, { debounceTime: 0 })
    );

    act(() => {
      result.current.setSearch("A");
      result.current.setSearch("B");
    });

    await waitForNextUpdate();

    expect(abortSpy).toHaveBeenCalled();
  });

});