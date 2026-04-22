import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import AccordionFilter from "../../src/Components/Common/AccordionFilter"

describe("AccordionFilter component", () => {

  // ✅ CORRECCIÓN 1: Usamos objetos en las opciones, que es lo que parece esperar el componente
  const filters = [
    { 
      key: "color", 
      title: "Color", 
      options: [
        { label: "Rojo", value: "Rojo" },
        { label: "Azul", value: "Azul" }
      ], 
      defaultOpen: true 
    },
    { 
      key: "size", 
      title: "Tamaño", 
      options: [
        { label: "S", value: "S" },
        { label: "M", value: "M" }
      ], 
      defaultOpen: true 
    }
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
    expect(screen.getByText(/Color/i)).toBeInTheDocument()
    expect(screen.getByText(/Tamaño/i)).toBeInTheDocument()

    // Verifica que las opciones existan (usamos regex para ser flexibles)
    expect(screen.getByText(/Rojo/i)).toBeInTheDocument()
    expect(screen.getByText(/Azul/i)).toBeInTheDocument()
  })

  it("llama a onChange con valores correctos al marcar/desmarcar checkbox", () => {
    const onChangeMock = vi.fn()
    const { container } = render(
      <AccordionFilter
        filters={filters}
        selectedFilters={{ color: [] }}
        onChange={onChangeMock}
        onClear={() => {}}
      />
    )

    // ✅ CORRECCIÓN 2: Buscamos el checkbox que acompaña al texto "Rojo"
    // Buscamos todos los checkboxes y hacemos clic en el primero (que corresponde a Rojo)
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    
    fireEvent.click(checkboxes[0]); // Clic en el primer checkbox (Rojo)

    // Verificamos que se llame con la llave "color" y el valor ["Rojo"]
    expect(onChangeMock).toHaveBeenCalledWith("color", expect.arrayContaining(["Rojo"]))
  })

  it("llama a onClear al presionar el botón limpiar", () => {
    const onClearMock = vi.fn()
    render(
      <AccordionFilter
        filters={filters}
        selectedFilters={{ color: ["Rojo"] }}
        onChange={() => {}}
        onClear={onClearMock}
      />
    )

    // El HTML mostró que el botón dice: "Limpiar Todos Los Filtros"
    const clearBtn = screen.getByText(/Limpiar/i)
    fireEvent.click(clearBtn)
    expect(onClearMock).toHaveBeenCalled()
  })
})