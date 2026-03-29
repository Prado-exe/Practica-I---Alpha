import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Login from "../../src/Pages/Login";

// 🔥 MOCKS

// Mock navigate
const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children }) => <a>{children}</a>
}));

// Mock AuthContext
const mockLogin = vi.fn();

vi.mock("../Context/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin
  })
}));

// Mock logo (import estático)
vi.mock("../assets/content.png", () => ({
  default: "logo.png"
}));

// Mock Captcha (aunque esté comentado)
vi.mock("../Components/Subcomponents/Captcha", () => ({
  default: () => <div>Captcha</div>
}));

// 🌐 MOCK FETCH
global.fetch = vi.fn();

describe("Login", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza el formulario correctamente", () => {
    render(<Login />);

    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
  });

  it("permite escribir en los inputs", () => {
    render(<Login />);

    const emailInput = screen.getByLabelText("Correo electrónico");
    const passwordInput = screen.getByLabelText("Contraseña");

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

    render(<Login />);

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "test@mail.com" }
    });

    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "123456" }
    });

    fireEvent.click(screen.getByText("Iniciar sesión"));

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

    window.alert = vi.fn();

    render(<Login />);

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "test@mail.com" }
    });

    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "123456" }
    });

    fireEvent.click(screen.getByText("Iniciar sesión"));

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

    window.alert = vi.fn();

    render(<Login />);

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "wrong@mail.com" }
    });

    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "wrongpass" }
    });

    fireEvent.click(screen.getByText("Iniciar sesión"));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Credenciales incorrectas");
    });
  });

  it("maneja error de red", async () => {
    fetch.mockRejectedValue(new Error("Network error"));

    window.alert = vi.fn();

    render(<Login />);

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "test@mail.com" }
    });

    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "123456" }
    });

    fireEvent.click(screen.getByText("Iniciar sesión"));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("No se pudo conectar con el backend");
    });
  });

  it("muestra estado loading", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        token: "fake-token",
        account: {}
      })
    });

    render(<Login />);

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "test@mail.com" }
    });

    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "123456" }
    });

    fireEvent.click(screen.getByText("Iniciar sesión"));

    expect(screen.getByText("Validando...")).toBeInTheDocument();
  });

});