import { render, screen } from "@testing-library/react";
import Loader from "../../src/Components/Common/Loader";
import "@testing-library/jest-dom/vitest";

describe("Loader", () => {

  test("renderiza el loader correctamente", () => {
    render(<Loader />);
    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });

});