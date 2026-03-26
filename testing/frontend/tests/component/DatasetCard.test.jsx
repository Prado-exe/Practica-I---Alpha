// src/Components/Cards/DatasetCard.test.jsx
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import DatasetCard from "../../src/Components/Cards/DatasetCard"

describe("DatasetCard component", () => {

  const mockDataset = {
    title: "Dataset de ejemplo",
    description: "Descripción del dataset",
    created: "2026-03-25",
    institution: "Universidad Ejemplo",
    tags: ["tag1", "tag2"]
  }

  it("renderiza título, descripción y fecha", () => {
    render(<DatasetCard dataset={mockDataset} />)

    expect(screen.getByText("Dataset de ejemplo")).toBeInTheDocument()
    expect(screen.getByText("Descripción del dataset")).toBeInTheDocument()
    expect(screen.getByText("2026-03-25")).toBeInTheDocument()
  })

  it("muestra la institución si existe", () => {
    render(<DatasetCard dataset={mockDataset} />)
    expect(screen.getByText("Universidad Ejemplo")).toBeInTheDocument()
  })

  it("renderiza los tags correctamente", () => {
    render(<DatasetCard dataset={mockDataset} />)
    expect(screen.getByText("tag1")).toBeInTheDocument()
    expect(screen.getByText("tag2")).toBeInTheDocument()
  })

  it("muestra 'Sin fecha' si no hay created", () => {
    const datasetSinFecha = { ...mockDataset, created: undefined }
    render(<DatasetCard dataset={datasetSinFecha} />)
    expect(screen.getByText("Sin fecha")).toBeInTheDocument()
  })

  it("no renderiza institución si no existe", () => {
    const datasetSinInstitution = { ...mockDataset, institution: undefined }
    render(<DatasetCard dataset={datasetSinInstitution} />)
    expect(screen.queryByText("Universidad Ejemplo")).not.toBeInTheDocument()
  })

  it("no renderiza tags si no existen", () => {
    const datasetSinTags = { ...mockDataset, tags: [] }
    render(<DatasetCard dataset={datasetSinTags} />)
    expect(screen.queryByText("tag1")).not.toBeInTheDocument()
  })
})