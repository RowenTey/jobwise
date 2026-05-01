import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";
import type { ReactNode } from "react";

function TestConsumer() {
  const { isAuthenticated, isLoading, login, signup, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? "logged-in" : "logged-out"}</span>
      <span data-testid="loading">{isLoading ? "loading" : "done"}</span>
      <button data-testid="btn-login" onClick={() => login("user", "pass")}>Login</button>
      <button data-testid="btn-signup" onClick={() => signup("u", "e@x.com", "p")}>Signup</button>
      <button data-testid="btn-logout" onClick={() => logout()}>Logout</button>
    </div>
  );
}

function renderWithProvider(children: ReactNode) {
  return render(<AuthProvider>{children}</AuthProvider>);
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn());
});

describe("AuthProvider", () => {
  it("shows logged-out when no token in storage", () => {
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId("auth-status").textContent).toBe("logged-out");
  });

  it("shows logged-in when accessToken in storage", () => {
    localStorage.setItem("accessToken", "existing-token");
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId("auth-status").textContent).toBe("logged-in");
  });

  it("sets authenticated after login", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: () => Promise.resolve({ accessToken: "a1", refreshToken: "r1" }),
      text: () => Promise.resolve(""),
    }));

    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId("auth-status").textContent).toBe("logged-out");

    await user.click(screen.getByTestId("btn-login"));

    expect(screen.getByTestId("auth-status").textContent).toBe("logged-in");
  });

  it("sets authenticated after signup", async () => {
    const user = userEvent.setup();
    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve({ ok: true, status: 201, headers: new Map(), text: () => Promise.resolve("") });
      return Promise.resolve({ ok: true, status: 200, headers: new Map([["content-type", "application/json"]]), json: () => Promise.resolve({ accessToken: "a1", refreshToken: "r1" }), text: () => Promise.resolve("") });
    }));

    renderWithProvider(<TestConsumer />);
    await user.click(screen.getByTestId("btn-signup"));

    expect(screen.getByTestId("auth-status").textContent).toBe("logged-in");
  });

  it("sets unauthenticated after logout", async () => {
    const user = userEvent.setup();
    localStorage.setItem("accessToken", "a1");
    localStorage.setItem("refreshToken", "r1");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, headers: new Map([["content-type", "application/json"]]), json: () => Promise.resolve({}), text: () => Promise.resolve("") }));

    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId("auth-status").textContent).toBe("logged-in");

    await user.click(screen.getByTestId("btn-logout"));

    expect(screen.getByTestId("auth-status").textContent).toBe("logged-out");
  });
});
