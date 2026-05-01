import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SignupPage from "./SignupPage";
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
      <SignupPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SignupPage", () => {
  it("renders all form fields", () => {
    mockAuth();
    renderPage();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("shows error if passwords do not match", async () => {
    const user = userEvent.setup();
    const signup = vi.fn();
    mockAuth({ signup });

    renderPage();

    await user.type(screen.getByLabelText("Password"), "pass1");
    await user.type(screen.getByLabelText("Confirm Password"), "pass2");
    fireEvent.submit(screen.getByRole("button", { name: /create account/i }).closest("form")!);

    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(signup).not.toHaveBeenCalled();
  });

  it("shows error on failed signup", async () => {
    const user = userEvent.setup();
    const signup = vi.fn().mockRejectedValue(new Error("Username taken"));
    mockAuth({ signup });

    renderPage();

    await user.type(screen.getByLabelText("Username"), "existing");
    await user.type(screen.getByLabelText("Email"), "e@e.com");
    await user.type(screen.getByLabelText("Password"), "pass123");
    await user.type(screen.getByLabelText("Confirm Password"), "pass123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText("Username taken")).toBeInTheDocument();
  });

  it("calls signup on form submit", async () => {
    const user = userEvent.setup();
    const signup = vi.fn().mockResolvedValue(undefined);
    mockAuth({ signup });

    renderPage();

    await user.type(screen.getByLabelText("Username"), "newuser");
    await user.type(screen.getByLabelText("Email"), "new@test.com");
    await user.type(screen.getByLabelText("Password"), "pass123");
    await user.type(screen.getByLabelText("Confirm Password"), "pass123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(signup).toHaveBeenCalledWith("newuser", "new@test.com", "pass123");
  });

  it("navigates to login on link click", () => {
    mockAuth();
    renderPage();
    const link = screen.getByRole("link", { name: /sign in/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("redirects to / when already authenticated", () => {
    mockAuth({ isAuthenticated: true });
    const { container } = renderPage();
    expect(container.innerHTML).toBe("");
  });
});
