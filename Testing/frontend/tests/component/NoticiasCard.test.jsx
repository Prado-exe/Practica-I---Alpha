// src/Components/Cards/NoticiasCard.test.jsx
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import NoticiasCard from "../../src/Components/Cards/NoticiasCard"

describe("NoticiasCard component", () => {

  const mockNews = {
    title: "Noticia de ejemplo",
    description: "Descripción de la noticia",
    date: "2026-03-25T12:00:00Z",
    image: "/imagen.png",
    category: "Actualidad",
    tags: ["tag1", "tag2"]
  }

  it("renderiza título, descripción y fecha", () => {
    render(<NoticiasCard news={mockNews} />)

    // Título
    expect(screen.getByText("Noticia de ejemplo")).toBeInTheDocument()
    // Descripción
    expect(screen.getByText("Descripción de la noticia")).toBeInTheDocument()
    // Fecha formateada
    const formattedDate = new Date(mockNews.date).toLocaleDateString()
    expect(screen.getByText(formattedDate)).toBeInTheDocument()
  })

  it("muestra la imagen con alt correcto", () => {
    render(<NoticiasCard news={mockNews} />)
    const img = screen.getByAltText("Noticia de ejemplo")
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute("src", "/imagen.png")
  })

  it("muestra la categoría y los tags", () => {
    render(<NoticiasCard news={mockNews} />)
    expect(screen.getByText("Actualidad")).toBeInTheDocument()
    expect(screen.getByText("tag1")).toBeInTheDocument()
    expect(screen.getByText("tag2")).toBeInTheDocument()
  })

  it("renderiza el botón 'Leer más →'", () => {
    render(<NoticiasCard news={mockNews} />)
    expect(screen.getByText("Leer más →")).toBeInTheDocument()
  })
})