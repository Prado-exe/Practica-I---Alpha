// src/Components/Common/SearchBarAdvanced.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SearchBarAdvanced from "./SearchBarAdvanced"
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
    expect(screen.getByText("Ordenar por:")).toBeInTheDocument()
  })

  it("updates query and calls onSearch after debounce", async () => {
    const onSearchMock = vi.fn()
    render(<SearchBarAdvanced onSearch={onSearchMock} debounceTime={100} />)

    const input = screen.getByPlaceholderText("Buscar...")
    await userEvent.type(input, "Hola")

    // Espera al debounce (100ms + margen)
    await waitFor(() => {
      expect(onSearchMock).toHaveBeenCalledWith("Hola", {})
    }, { timeout: 200 })
  })

  it("opens filter menu when toggle button is clicked", async () => {
    render(<SearchBarAdvanced filters={filters} sortOptions={sortOptions} />)

    const toggleBtn = screen.getByRole("button", { name: /default/i })
    expect(screen.getByText("Ordenar por:")).toBeInTheDocument()

    // Al hacer click abre el menú
    fireEvent.click(toggleBtn)
    expect(screen.getByText("Ordenar por")).toBeInTheDocument()
    expect(screen.getByText("Orden")).toBeInTheDocument()
    expect(screen.getByText("Categoria")).toBeInTheDocument()
  })

  it("changes sort and calls onSortChange", async () => {
    const onSortChangeMock = vi.fn()
    render(<SearchBarAdvanced sortOptions={sortOptions} onSortChange={onSortChangeMock} />)

    const sortSelect = screen.getByLabelText("Ordenar por") || screen.getByRole("combobox", { name: /ordenar por/i })
    fireEvent.change(sortSelect, { target: { value: "name" } })

    await waitFor(() => {
      expect(onSortChangeMock).toHaveBeenCalledWith({ sortBy: "name", order: "asc" })
    })
  })
})