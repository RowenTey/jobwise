import type { PaginatedResponse, ApplicationDto, ApiKeyResponse, ApplicationCreateRequest, ApplicationStatus } from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";

function getTokens(): { access: string | null; refresh: string | null } {
  return {
    access: localStorage.getItem("accessToken"),
    refresh: localStorage.getItem("refreshToken"),
  };
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
}

function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

async function refreshAccessToken(): Promise<string | null> {
  const { refresh } = getTokens();
  if (!refresh) return null;
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { access } = getTokens();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (access) headers["Authorization"] = `Bearer ${access}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && access) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      headers["Authorization"] = `Bearer ${newAccess}`;
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();
  if (!text) return undefined as T;
  const num = Number(text);
  if (!Number.isNaN(num)) return num as unknown as T;
  return text as unknown as T;
}

export async function login(username: string, password: string) {
  const data = await apiRequest<{ accessToken: string; refreshToken: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function signup(username: string, email: string, password: string) {
  await apiRequest("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
  return login(username, password);
}

export async function logout() {
  const { refresh } = getTokens();
  try {
    await apiRequest("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken: refresh }),
    });
  } catch {
    // Best-effort — tokens cleared below regardless
  } finally {
    clearTokens();
  }
}

export async function fetchApplications(params: {
  page?: number;
  size?: number;
  sort?: string;
  direction?: "asc" | "desc";
  status?: string;
}) {
  const qs = new URLSearchParams();
  if (params.page !== undefined) qs.set("page", String(params.page));
  if (params.size !== undefined) qs.set("size", String(params.size));
  if (params.sort) qs.set("sort", params.sort);
  if (params.direction) qs.set("direction", params.direction);
  if (params.status) qs.set("status", params.status);
  return apiRequest<PaginatedResponse<ApplicationDto>>(`/applications?${qs.toString()}`);
}

export async function updateApplicationStatus(id: number, status: ApplicationStatus) {
  return apiRequest<void>(`/applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function createApplication(request: ApplicationCreateRequest) {
  return apiRequest<number>("/applications", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function fetchApiKeys() {
  return apiRequest<ApiKeyResponse[]>("/auth/api-keys");
}

export async function createApiKey(name: string) {
  return apiRequest<ApiKeyResponse>("/auth/api-keys", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function revokeApiKey(id: number) {
  return apiRequest<void>(`/auth/api-keys/${id}`, { method: "DELETE" });
}
