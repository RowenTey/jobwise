import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./LoginPage";
import * as AuthContext from "../context/AuthContext";

function mockAuth(overrides: Partial<ReturnType<typeof AuthContext.useAuth>> = {}) {
  const defaults = {
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
  };
  vi.spyOn(AuthContext, "useAuth").mockReturnValue({ ...defaults, ...overrides });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LoginPage", () => {
  it("renders username and password fields", () => {
    mockAuth();
    renderPage();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows error on failed login", async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue(new Error("Invalid credentials"));
    mockAuth({ login });

    renderPage();

    await user.type(screen.getByLabelText("Username"), "baduser");
    await user.type(screen.getByLabelText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText("Invalid username or password")).toBeInTheDocument();
  });

  it("calls login on form submit", async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue(undefined);
    mockAuth({ login });

    renderPage();

    await user.type(screen.getByLabelText("Username"), "testuser");
    await user.type(screen.getByLabelText("Password"), "testpass");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(login).toHaveBeenCalledWith("testuser", "testpass");
  });

  it("navigates to signup on link click", () => {
    mockAuth();
    renderPage();
    const link = screen.getByRole("link", { name: /sign up/i });
    expect(link).toHaveAttribute("href", "/signup");
  });

  it("redirects to / when already authenticated", () => {
    mockAuth({ isAuthenticated: true });
    const { container } = renderPage();
    expect(container.innerHTML).toBe("");
  });
});
