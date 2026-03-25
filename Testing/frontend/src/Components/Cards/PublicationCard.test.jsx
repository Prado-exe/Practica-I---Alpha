// src/Components/Cards/PublicationCard.test.jsx
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import PublicationCard from "./PublicationCard"

describe("PublicationCard component", () => {

  const mockPublication = {
    title: "Publicación de ejemplo",
    description: "Descripción de la publicación",
    date: "2026-03-25T12:00:00Z",
    author: "Autor Ejemplo",
    type: "Artículo",
    tags: ["tag1", "tag2"]
  }

  it("renderiza fecha, autor, título y descripción", () => {
    render(<PublicationCard publication={mockPublication} />)

    // Fecha
    const formattedDate = new Date(mockPublication.date).toLocaleDateString()
    expect(screen.getByText(formattedDate)).toBeInTheDocument()

    // Autor
    expect(screen.getByText("Autor Ejemplo")).toBeInTheDocument()

    // Título
    expect(screen.getByText("Publicación de ejemplo")).toBeInTheDocument()

    // Descripción
    expect(screen.getByText("Descripción de la publicación")).toBeInTheDocument()
  })

  it("muestra el tipo y los tags", () => {
    render(<PublicationCard publication={mockPublication} />)
    expect(screen.getByText("Artículo")).toBeInTheDocument()
    expect(screen.getByText("tag1")).toBeInTheDocument()
    expect(screen.getByText("tag2")).toBeInTheDocument()
  })

  it("renderiza el botón 'Ver publicación →'", () => {
    render(<PublicationCard publication={mockPublication} />)
    expect(screen.getByText("Ver publicación →")).toBeInTheDocument()
  })
})