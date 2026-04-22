import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Login from "../../src/Pages/Login";
import { MemoryRouter } from "react-router-dom";

// 🔥 MOCKS

// 1. Mock de react-router-dom (intercepta useNavigate pero mantiene el resto funcional)
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// 2. Mock AuthContext (✅ Ruta corregida)
const mockLogin = vi.fn();
vi.mock("../../src/Context/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin
  })
}));

// 3. Mock logo (✅ Ruta corregida)
vi.mock("../../src/assets/content.png", () => ({
  default: "logo.png"
}));

// 4. Mock Captcha (✅ Ruta corregida)
vi.mock("../../src/Components/Subcomponents/Captcha", () => ({
  default: () => <div data-testid="captcha-mock">Captcha</div>
}));

// 🌐 MOCK FETCH
global.fetch = vi.fn();

// Helper de renderizado
const renderComponent = () => {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
};

describe("Login", () => {

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it("renderiza el formulario correctamente", () => {
    const { container } = renderComponent();

    // Verificamos que existen 2 inputs (email y password)
    const inputs = container.querySelectorAll("input");
    expect(inputs.length).toBeGreaterThanOrEqual(2);
    
    // Verificamos el botón (usamos regex por si dice "Iniciar Sesión" o "Iniciar sesión")
    expect(screen.getByRole("button", { name: /Iniciar sesión/i })).toBeInTheDocument();
  });

  it("permite escribir en los inputs", () => {
    const { container } = renderComponent();

    // Buscamos los inputs directamente del DOM
    const inputs = container.querySelectorAll("input");
    const emailInput = inputs[0];
    const passwordInput = inputs[1];

    fireEvent.change(emailInput, { target: { value: "test@mail.com" } });
    fireEvent.change(passwordInput, { target: { value: "123456" } });

    expect(emailInput.value).toBe("test@mail.com");
    expect(passwordInput.value).toBe("123456");
  });

  it("hace login exitoso y redirige al home", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        token: "fake-token",
        expiresAt: "123456",
        account: {
          email: "test@mail.com",
          permissions: ["user.read"]
        }
      })
    });

    const { container } = renderComponent();
    const inputs = container.querySelectorAll("input");
    
    fireEvent.change(inputs[0], { target: { value: "test@mail.com" } });
    fireEvent.change(inputs[1], { target: { value: "123456" } });

    const submitBtn = screen.getByRole("button", { name: /Iniciar sesión/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("redirige a verificación si requiere revalidación", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        requiresRevalidation: true,
        message: "Verifica tu cuenta",
        email: "test@mail.com"
      })
    });

    const { container } = renderComponent();
    const inputs = container.querySelectorAll("input");

    fireEvent.change(inputs[0], { target: { value: "test@mail.com" } });
    fireEvent.change(inputs[1], { target: { value: "123456" } });

    const submitBtn = screen.getByRole("button", { name: /Iniciar sesión/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalled();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/verificacion", {
      state: { email: "test@mail.com" }
    });
  });

  it("muestra error si backend responde mal", async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        message: "Credenciales incorrectas"
      })
    });

    const { container } = renderComponent();
    const inputs = container.querySelectorAll("input");

    fireEvent.change(inputs[0], { target: { value: "wrong@mail.com" } });
    fireEvent.change(inputs[1], { target: { value: "wrongpass" } });

    const submitBtn = screen.getByRole("button", { name: /Iniciar sesión/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Credenciales incorrectas");
    });
  });

  it("maneja error de red", async () => {
    fetch.mockRejectedValue(new Error("Network error"));

    const { container } = renderComponent();
    const inputs = container.querySelectorAll("input");

    fireEvent.change(inputs[0], { target: { value: "test@mail.com" } });
    fireEvent.change(inputs[1], { target: { value: "123456" } });

    const submitBtn = screen.getByRole("button", { name: /Iniciar sesión/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("No se pudo conectar"));
    });
  });

  it("muestra estado loading", async () => {
    // Simulamos una promesa que no se resuelve inmediatamente
    fetch.mockImplementation(() => new Promise(() => {}));

    const { container } = renderComponent();
    const inputs = container.querySelectorAll("input");

    fireEvent.change(inputs[0], { target: { value: "test@mail.com" } });
    fireEvent.change(inputs[1], { target: { value: "123456" } });

    const submitBtn = screen.getByRole("button", { name: /Iniciar sesión/i });
    fireEvent.click(submitBtn);

    // Usamos regex por si dice "Validando...", "Cargando", etc.
    expect(screen.getByText(/Validando/i)).toBeInTheDocument();
  });

});