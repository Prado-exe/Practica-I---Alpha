// src/Components/Footer/Footer.test.jsx
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import Footer from "./Footer"

describe("Footer component", () => {

  it("renderiza los logos correctamente", () => {
    render(<Footer />)

    expect(screen.getByAltText("Logo del proyecto Content")).toBeInTheDocument()
    expect(screen.getByAltText("Logo Universidad de La Serena")).toBeInTheDocument()
  })

  it("renderiza las secciones y enlaces", () => {
    render(<Footer />)

    // Secciones
    expect(screen.getByRole("heading", { name: "Datos y contenidos" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Sobre nosotros" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Contacto" })).toBeInTheDocument()

    // Enlaces de 'Datos y contenidos'
    expect(screen.getByText("Datos")).toBeInTheDocument()
    expect(screen.getByText("Instituciones")).toBeInTheDocument()
    expect(screen.getByText("Indicadores")).toBeInTheDocument()
    expect(screen.getByText("Publicaciones")).toBeInTheDocument()
    expect(screen.getByText("Noticias")).toBeInTheDocument()

    // Enlaces de 'Sobre nosotros'
    expect(screen.getByText("Objetivo estratégico")).toBeInTheDocument()
    expect(screen.getByText("Visión y misión")).toBeInTheDocument()
    expect(screen.getByText("Principios")).toBeInTheDocument()
    expect(screen.getByText("Metodología")).toBeInTheDocument()

    // Enlaces de 'Contacto'
    expect(screen.getByText("Formulario de contacto")).toBeInTheDocument()
  })

  it("muestra el copyright", () => {
    render(<Footer />)
    expect(screen.getByText("© 2026 Plataforma de Datos – Universidad de La Serena")).toBeInTheDocument()
  })
})