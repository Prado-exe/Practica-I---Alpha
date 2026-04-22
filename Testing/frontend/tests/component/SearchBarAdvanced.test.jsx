import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SearchBarAdvanced from "../../src/Components/Common/SearchBarAdvanced"
import { describe, it, expect, vi } from "vitest"

describe("SearchBarAdvanced component", () => {

  const filters = [
    { label: "Categoria", options: ["A", "B", "C"] }
  ]
  const sortOptions = [
    { label: "Nombre", value: "name" },
    { label: "Fecha", value: "date" }
  ]

  it("renders input, search button and filter toggle", () => {
    render(<SearchBarAdvanced filters={filters} sortOptions={sortOptions} />)

    expect(screen.getByPlaceholderText("Buscar...")).toBeInTheDocument()
    expect(screen.getByText("Buscar")).toBeInTheDocument()
    
    // ✅ CORRECCIÓN: Usamos getAllByText porque el texto aparece 2 veces en tu UI
    const ordenarPorElements = screen.getAllByText(/Ordenar por/i)
    expect(ordenarPorElements.length).toBeGreaterThan(0)
    expect(ordenarPorElements[0]).toBeInTheDocument()
  })

  it("updates query and calls onSearch after debounce", async () => {
    const onSearchMock = vi.fn()
    render(<SearchBarAdvanced onSearch={onSearchMock} debounceTime={100} />)

    const input = screen.getByPlaceholderText("Buscar...")
    await userEvent.type(input, "Hola")

    // Espera al debounce (100ms + margen)
    await waitFor(() => {
      expect(onSearchMock).toHaveBeenCalledWith("Hola", expect.any(Object))
    }, { timeout: 300 })
  })

  it("opens filter menu when toggle button is clicked", async () => {
    render(<SearchBarAdvanced filters={filters} sortOptions={sortOptions} />)

    const toggleBtn = screen.getByRole("button", { name: /default/i })

    // Al hacer click abre el menú
    fireEvent.click(toggleBtn)
    
    // Usamos regex para ser flexibles
    expect(screen.getByText(/Categoria/i)).toBeInTheDocument()
  })

  it("changes sort and calls onSortChange", async () => {
    const onSortChangeMock = vi.fn()
    const { container } = render(
      <SearchBarAdvanced sortOptions={sortOptions} onSortChange={onSortChangeMock} />
    )

    // 1. Si el select está oculto en un menú, lo abrimos primero
    const toggleBtn = screen.queryByRole("button", { name: /default/i })
    if (toggleBtn) {
      fireEvent.click(toggleBtn)
    }

    // 2. Buscamos el select de forma segura y directa
    const sortSelect = container.querySelector("select")
    
    // 3. Cambiamos el valor
    fireEvent.change(sortSelect, { target: { value: "name" } })

    // 4. Verificamos la llamada
    await waitFor(() => {
      expect(onSortChangeMock).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: "name" })
      )
    })
  })
})