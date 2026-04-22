import { render, screen, fireEvent } from "@testing-library/react";
import Pagination from "../../src/Components/Common/Pagination";
import "@testing-library/jest-dom/vitest";
import { describe, test, expect, vi, beforeEach } from "vitest";

describe("Pagination", () => {

  // 🔥 mock global para evitar error de scroll
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  test("renderiza números de página correctamente", () => {
    render(
      <Pagination currentPage={1} totalPages={3} onPageChange={() => {}} />
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("marca la página actual", () => {
    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={() => {}} />
    );

    const current = screen.getByRole("button", { name: /página actual, 2/i });

    expect(current).toHaveAttribute("aria-current", "page");
  });

  test("llama a onPageChange al hacer click", () => {
    const onPageChange = vi.fn();

    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
    );

    const page2 = screen.getByRole("button", { name: /ir a la página 2/i });

    // ✅ Cambiamos userEvent por fireEvent (y quitamos el await porque fireEvent es síncrono)
    fireEvent.click(page2);

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  test("no hace nada al hacer click en página actual", () => {
    const onPageChange = vi.fn();

    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />
    );

    const current = screen.getByRole("button", { name: /página actual, 2/i });

    fireEvent.click(current);

    expect(onPageChange).not.toHaveBeenCalled();
  });

  test("botón anterior está deshabilitado en página 1", () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />
    );

    const prev = screen.getByLabelText(/página anterior/i);

    expect(prev).toBeDisabled();
  });

  test("botón siguiente está deshabilitado en última página", () => {
    render(
      <Pagination currentPage={5} totalPages={5} onPageChange={() => {}} />
    );

    const next = screen.getByLabelText(/página siguiente/i);

    expect(next).toBeDisabled();
  });

  test("botón siguiente funciona", () => {
    const onPageChange = vi.fn();

    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />
    );

    const next = screen.getByLabelText(/página siguiente/i);

    fireEvent.click(next);

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  test("muestra puntos suspensivos cuando hay muchas páginas", () => {
    render(
      <Pagination currentPage={5} totalPages={10} onPageChange={() => {}} />
    );

    expect(screen.getAllByText("…")).toHaveLength(2);
  });

  test("selector cambia de página", () => {
    const onPageChange = vi.fn();

    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
    );

    const select = screen.getByLabelText(/ir a página/i);

    // ✅ En fireEvent la selección de un <select> se simula con un change normal
    fireEvent.change(select, { target: { value: "3" } });

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

});