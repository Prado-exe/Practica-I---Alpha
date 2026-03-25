// src/Components/Cards/InstitucionCard.test.jsx
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import InstitucionCard from "./InstitucionCard"

// Mock de useNavigate
const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe("InstitucionCard component", () => {

  const institucion = {
    id: "123",
    nombre: "Instituto Ejemplo",
    descripcion: "Descripción de la institución",
    datasets: 5,
    logo: "/logo.png"
  }

  it("renderiza correctamente los datos de la institución", () => {
    render(<InstitucionCard institucion={institucion} />)

    // Nombre
    expect(screen.getByText("Instituto Ejemplo")).toBeInTheDocument()
    // Descripción
    expect(screen.getByText("Descripción de la institución")).toBeInTheDocument()
    // Dataset count
    expect(screen.getByText("5 datasets")).toBeInTheDocument()
    // Imagen
    expect(screen.getByAltText("Logo de Instituto Ejemplo")).toBeInTheDocument()
  })

  it("llama a navigate con la ruta correcta al hacer click en el botón", () => {
    render(<InstitucionCard institucion={institucion} />)

    const btn = screen.getByText("Ver institución")
    fireEvent.click(btn)

    expect(mockNavigate).toHaveBeenCalledWith("/instituciones/123")
  })
})