import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  apiRequest,
  login,
  signup,
  logout,
  fetchApplications,
  createApplication,
  updateApplicationStatus,
  revokeApiKey,
} from "./api";
import type { ApplicationCreateRequest, JobType } from "../types";

const BASE_URL = "http://localhost:8080/api/v1";

function mockFetch(status: number, body: unknown, contentType?: string) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: new Map([["content-type", contentType ?? "application/json"]]),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  localStorage.clear();
});

describe("apiRequest", () => {
  it("sends JSON requests with correct headers", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: () => Promise.resolve({ data: "ok" }),
      text: () => Promise.resolve(""),
    });
    vi.stubGlobal("fetch", fetch);

    await apiRequest("/test", { method: "POST", body: JSON.stringify({ foo: "bar" }) });

    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/test`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ foo: "bar" }),
      }),
    );
  });

  it("attaches Bearer token when available", async () => {
    localStorage.setItem("accessToken", "test-token");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
    }));

    await apiRequest("/test");

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
  });

  it("parses JSON responses", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { message: "hello" }));

    const result = await apiRequest<{ message: string }>("/test");

    expect(result).toEqual({ message: "hello" });
  });

  it("handles 204 No Content", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Map(),
      text: () => Promise.resolve(""),
    }));

    const result = await apiRequest<void>("/test");

    expect(result).toBeUndefined();
  });

  it("handles raw number responses (no JSON content-type)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Map(),
      text: () => Promise.resolve("42"),
    }));

    const result = await apiRequest<number>("/test");

    expect(result).toBe(42);
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Map([["content-type", "application/json"]]),
      json: () => Promise.resolve({ message: "Bad request" }),
      text: () => Promise.resolve(JSON.stringify({ message: "Bad request" })),
    }));

    await expect(apiRequest("/test")).rejects.toThrow();
  });

  it("refreshes token on 401 and retries", async () => {
    localStorage.setItem("accessToken", "expired-token");
    localStorage.setItem("refreshToken", "refresh-token");

    let callCount = 0;
    const fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 401,
          headers: new Map(),
          text: () => Promise.resolve("Unauthorized"),
        });
      }
      if (callCount === 2) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Map([["content-type", "application/json"]]),
          json: () => Promise.resolve({ accessToken: "new-access", refreshToken: "new-refresh" }),
          text: () => Promise.resolve(""),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve({ data: "retried" }),
        text: () => Promise.resolve(""),
      });
    });
    vi.stubGlobal("fetch", fetch);

    const result = await apiRequest<{ data: string }>("/test");

    expect(result).toEqual({ data: "retried" });
    expect(callCount).toBe(3);
    expect(localStorage.getItem("accessToken")).toBe("new-access");
  });
});

describe("login", () => {
  it("sends credentials and stores tokens", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { accessToken: "a1", refreshToken: "r1" }));

    const result = await login("user", "pass");

    expect(result).toEqual({ accessToken: "a1", refreshToken: "r1" });
    expect(localStorage.getItem("accessToken")).toBe("a1");
    expect(localStorage.getItem("refreshToken")).toBe("r1");
  });

  it("throws on invalid credentials", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Map(),
      text: () => Promise.resolve("Invalid credentials"),
    }));

    await expect(login("bad", "wrong")).rejects.toThrow();
  });
});

describe("signup", () => {
  it("calls signup then login", async () => {
    let callCount = 0;
    const fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // signup returns 201 with no body
        return Promise.resolve({
          ok: true,
          status: 201,
          headers: new Map(),
          text: () => Promise.resolve(""),
        });
      }
      // login returns tokens
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve({ accessToken: "a1", refreshToken: "r1" }),
        text: () => Promise.resolve(""),
      });
    });
    vi.stubGlobal("fetch", fetch);

    const result = await signup("newuser", "new@test.com", "pass123");

    expect(callCount).toBe(2);
    expect(result).toEqual({ accessToken: "a1", refreshToken: "r1" });

    // Verify first call was to /auth/signup
    expect(fetch.mock.calls[0][0]).toContain("/auth/signup");
    // Verify second call was to /auth/login
    expect(fetch.mock.calls[1][0]).toContain("/auth/login");
  });
});

describe("logout", () => {
  it("calls logout API and clears tokens", async () => {
    localStorage.setItem("accessToken", "a1");
    localStorage.setItem("refreshToken", "r1");
    vi.stubGlobal("fetch", mockFetch(200, {}));

    await logout();

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });

  it("clears tokens even if API call fails", async () => {
    localStorage.setItem("accessToken", "a1");
    localStorage.setItem("refreshToken", "r1");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    await logout();

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });
});

describe("fetchApplications", () => {
  it("includes query parameters", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: () => Promise.resolve({ content: [], totalPages: 0, totalElements: 0, number: 0, size: 20 }),
      text: () => Promise.resolve(""),
    });
    vi.stubGlobal("fetch", fetch);

    await fetchApplications({ page: 1, size: 10, sort: "lastUpdated", direction: "desc", status: "APPLIED" });

    const url = fetch.mock.calls[0][0];
    expect(url).toContain("page=1");
    expect(url).toContain("size=10");
    expect(url).toContain("sort=lastUpdated");
    expect(url).toContain("direction=desc");
    expect(url).toContain("status=APPLIED");
  });
});

describe("createApplication", () => {
  it("sends request and returns the ID", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Map(),
      text: () => Promise.resolve("7"),
    }));

    const payload: ApplicationCreateRequest = {
      source: "Manual",
      company: { name: "Acme" },
      job: { title: "Engineer", description: "Role", jobType: "FULL_TIME" as JobType, externalUrl: "https://acme.com/job" },
    };

    const result = await createApplication(payload);

    expect(result).toBe(7);
  });
});

describe("updateApplicationStatus", () => {
  it("sends PATCH with new status", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
    });
    vi.stubGlobal("fetch", fetch);

    await updateApplicationStatus(5, "INTERVIEW");

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain("/applications/5/status");
    expect(opts.method).toBe("PATCH");
    expect(JSON.parse(opts.body)).toEqual({ status: "INTERVIEW" });
  });
});

describe("fetchApiKeys / revokeApiKey", () => {
  it("revokeApiKey sends DELETE", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Map(),
      text: () => Promise.resolve(""),
    });
    vi.stubGlobal("fetch", fetch);

    await revokeApiKey(3);

    const [url] = fetch.mock.calls[0];
    expect(url).toContain("/auth/api-keys/3");
  });
});
