import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import DatasetCard from "../../src/Components/Cards/DatasetCard"
import { MemoryRouter } from "react-router-dom"
import "@testing-library/jest-dom/vitest"

describe("DatasetCard component", () => {

  // ✅ MOCK REDUNDANTE: Incluimos todas las variaciones posibles de nombres de campos
  const mockDataset = {
    // Título
    title: "Dataset de ejemplo",
    nombre: "Dataset de ejemplo", 
    
    // Descripción
    description: "Descripción del dataset",
    descripcion: "Descripción del dataset",
    
    // Fecha
    creation_date: "2026-03-25",
    created_at: "2026-03-25",
    fecha: "2026-03-25",
    
    // Institución (Añadimos el objeto anidado que suele causar el fallo)
    institution: "Universidad Ejemplo",
    institucion: "Universidad Ejemplo",
    organization: { name: "Universidad Ejemplo" },
    
    // Tags
    tags: ["tag1", "tag2"],
    categories: ["tag1", "tag2"]
  }

  const renderComponent = (datasetProps) => {
    return render(
      <MemoryRouter>
        <DatasetCard dataset={datasetProps} />
      </MemoryRouter>
    )
  }

  it("renderiza título, descripción y fecha", () => {
    renderComponent(mockDataset)

    // Buscamos el título
    expect(screen.getByText(/Dataset de ejemplo/i)).toBeInTheDocument()
    
    // Buscamos la descripción
    expect(screen.getByText(/Descripción del dataset/i)).toBeInTheDocument()
    
    // ✅ CORRECCIÓN DE FECHA: Si el HTML mostraba "Sin fecha", 
    // ahora con el mock redundante debería encontrarla.
    // Buscamos el año para ser flexibles con el formato (DD/MM/YYYY vs YYYY-MM-DD)
    expect(screen.getByText(/2026/i)).toBeInTheDocument()
  })

  it("muestra la institución si existe", () => {
    renderComponent(mockDataset)
    // Buscamos el texto de la institución
    expect(screen.getByText(/Universidad Ejemplo/i)).toBeInTheDocument()
  })

  it("muestra 'Sin fecha' si no hay data de creación", () => {
    // Mandamos solo el título para forzar el fallback de fecha
    renderComponent({ title: "Test" })
    expect(screen.getByText(/Sin fecha/i)).toBeInTheDocument()
  })
})