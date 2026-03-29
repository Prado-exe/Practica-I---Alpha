// src/Components/Common/CanView.test.jsx
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import CanView from "./CanView"

// Mock del hook useAuth
vi.mock("../../Context/AuthContext", () => ({
  useAuth: vi.fn()
}))

import { useAuth } from "../../Context/AuthContext"

describe("CanView component", () => {

  const Child = () => <div>Contenido visible</div>

  it("no renderiza nada si no hay usuario", () => {
    useAuth.mockReturnValue({ user: null })
    const { container } = render(
      <CanView requiredPermission="view_dashboard">
        <Child />
      </CanView>
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("renderiza hijos si no se requiere permiso", () => {
    useAuth.mockReturnValue({ user: { role: "user", permissions: [] } })
    render(
      <CanView>
        <Child />
      </CanView>
    )
    expect(screen.getByText("Contenido visible")).toBeInTheDocument()
  })

  it("renderiza hijos si el usuario es super_admin", () => {
    useAuth.mockReturnValue({ user: { role: "super_admin", permissions: [] } })
    render(
      <CanView requiredPermission="anything">
        <Child />
      </CanView>
    )
    expect(screen.getByText("Contenido visible")).toBeInTheDocument()
  })

  it("renderiza hijos si el usuario tiene el permiso requerido", () => {
    useAuth.mockReturnValue({ user: { role: "user", permissions: ["view_dashboard"] } })
    render(
      <CanView requiredPermission="view_dashboard">
        <Child />
      </CanView>
    )
    expect(screen.getByText("Contenido visible")).toBeInTheDocument()
  })

  it("no renderiza si el usuario no tiene el permiso requerido", () => {
    useAuth.mockReturnValue({ user: { role: "user", permissions: ["other_permission"] } })
    const { container } = render(
      <CanView requiredPermission="view_dashboard">
        <Child />
      </CanView>
    )
    expect(container).toBeEmptyDOMElement()
  })
})