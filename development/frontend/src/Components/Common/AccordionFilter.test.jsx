// src/Components/Common/AccordionFilter.test.jsx
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import AccordionFilter from "./AccordionFilter"

describe("AccordionFilter component", () => {

  const filters = [
    { key: "color", title: "Color", options: ["Rojo", "Azul"], defaultOpen: true },
    { key: "size", title: "Tamaño", options: ["S", "M", "L"], defaultOpen: false }
  ]

  it("renderiza todos los filtros y opciones", () => {
    render(
      <AccordionFilter
        filters={filters}
        selectedFilters={{}}
        onChange={() => {}}
        onClear={() => {}}
      />
    )

    // Verifica que los títulos aparezcan
    expect(screen.getByText("Color")).toBeInTheDocument()
    expect(screen.getByText("Tamaño")).toBeInTheDocument()

    // Verifica opciones de color
    expect(screen.getByLabelText("Rojo")).toBeInTheDocument()
    expect(screen.getByLabelText("Azul")).toBeInTheDocument()
    // Verifica opciones de tamaño
    expect(screen.getByLabelText("S")).toBeInTheDocument()
    expect(screen.getByLabelText("M")).toBeInTheDocument()
    expect(screen.getByLabelText("L")).toBeInTheDocument()
  })

  it("llama a onChange con valores correctos al marcar/desmarcar checkbox", () => {
    const onChangeMock = vi.fn()
    render(
      <AccordionFilter
        filters={filters}
        selectedFilters={{ color: [] }}
        onChange={onChangeMock}
        onClear={() => {}}
      />
    )

    const rojoCheckbox = screen.getByLabelText("Rojo")
    // Marcar Rojo
    fireEvent.click(rojoCheckbox)
    expect(onChangeMock).toHaveBeenCalledWith("color", ["Rojo"])

    // Desmarcar Rojo
    fireEvent.click(rojoCheckbox)
    expect(onChangeMock).toHaveBeenCalledWith("color", [])
  })

  it("llama a onClear al presionar el botón limpiar", () => {
    const onClearMock = vi.fn()
    render(
      <AccordionFilter
        filters={filters}
        selectedFilters={{}}
        onChange={() => {}}
        onClear={onClearMock}
      />
    )

    const clearBtn = screen.getByText("Limpiar filtros")
    fireEvent.click(clearBtn)
    expect(onClearMock).toHaveBeenCalled()
  })
})