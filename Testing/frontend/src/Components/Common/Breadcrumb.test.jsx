// src/Components/Common/Breadcrumb.test.jsx
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, it, expect, vi } from "vitest"
import Breadcrumb from "./Breadcrumb"

// Mock de useLocation
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useLocation: vi.fn()
  }
})

import { useLocation } from "react-router-dom"

describe("Breadcrumb component", () => {

  it("renderiza breadcrumb para ruta raíz", () => {
    useLocation.mockReturnValue({ pathname: "/" })

    render(
      <MemoryRouter>
        <Breadcrumb />
      </MemoryRouter>
    )

    // Solo debería mostrar el Home
    expect(screen.getByText("Inicio")).toBeInTheDocument()
    // No hay más links
    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(1)
  })

  it("renderiza breadcrumbs para ruta profunda", () => {
    useLocation.mockReturnValue({ pathname: "/users/profile/edit" })

    render(
      <MemoryRouter>
        <Breadcrumb />
      </MemoryRouter>
    )

    // Verifica que los labels estén correctamente formateados
    expect(screen.getByText("Users")).toBeInTheDocument()
    expect(screen.getByText("Profile")).toBeInTheDocument()
    expect(screen.getByText("Edit")).toBeInTheDocument()

    // Verifica que el último crumb no sea un link
    const editCrumb = screen.getByText("Edit")
    expect(editCrumb.tagName).toBe("SPAN") // breadcrumb-current
  })

  it("cada breadcrumb intermedio es un link", () => {
    useLocation.mockReturnValue({ pathname: "/users/profile/edit" })

    render(
      <MemoryRouter>
        <Breadcrumb />
      </MemoryRouter>
    )

    const links = screen.getAllByRole("link")
    // Home + Users + Profile = 3 links
    expect(links).toHaveLength(3)

    // Verifica que los links tengan el href correcto
    expect(links[1]).toHaveAttribute("href", "/users")
    expect(links[2]).toHaveAttribute("href", "/users/profile")
  })
})