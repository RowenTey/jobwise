import type { ApplicationDto, ExtensionSettings, PaginatedResponse, UserProfile } from "./types.js";

export const KEYS = {
  API_URL: "apiUrl",
  API_KEY: "apiKey",
  PROFILE: "profile",
} as const;

export function getElementById<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} not found`);
  return el as T;
}

export function getApiKey(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(KEYS.API_KEY, (result: Record<string, unknown>) => {
      resolve((result[KEYS.API_KEY] as string) ?? null);
    });
  });
}

export function getApiUrl(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(KEYS.API_URL, (result: Record<string, unknown>) => {
      resolve((result[KEYS.API_URL] as string) ?? null);
    });
  });
}

export function getProfile(): Promise<UserProfile | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(KEYS.PROFILE, (result: Record<string, unknown>) => {
      resolve((result[KEYS.PROFILE] as UserProfile) ?? null);
    });
  });
}

export function getSettings(): Promise<ExtensionSettings | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      [KEYS.API_URL, KEYS.API_KEY, KEYS.PROFILE],
      (result: Record<string, unknown>) => {
        const apiUrl = result[KEYS.API_URL] as string | undefined;
        const apiKey = result[KEYS.API_KEY] as string | undefined;
        const profile = result[KEYS.PROFILE] as UserProfile | undefined;

        if (!apiUrl || !apiKey || !profile) {
          resolve(null);
          return;
        }
        resolve({ apiUrl, apiKey, profile });
      }
    );
  });
}

export function saveSettings(settings: ExtensionSettings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      {
        [KEYS.API_URL]: settings.apiUrl,
        [KEYS.API_KEY]: settings.apiKey,
        [KEYS.PROFILE]: settings.profile,
      } satisfies Record<string, unknown>,
      resolve
    );
  });
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const apiUrl = await getApiUrl();
  const apiKey = await getApiKey();

  if (!apiUrl || !apiKey) {
    throw new Error("Extension not configured. Please set API URL and API Key in settings.");
  }

  const url = `${apiUrl.replace(/\/+$/, "")}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
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

export async function fetchApplications(): Promise<ApplicationDto[]> {
  const result = await apiRequest<PaginatedResponse<ApplicationDto>>(
    "/applications?size=100&sort=lastUpdated&direction=desc"
  );
  return result.content;
}

export async function createApplication(
  data: Record<string, unknown>
): Promise<number> {
  return apiRequest<number>("/applications", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateApplicationStatus(
  id: number,
  status: string
): Promise<ApplicationDto> {
  return apiRequest<ApplicationDto>(`/applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function validateApiKey(apiUrl: string, apiKey: string): Promise<boolean> {
  try {
    const url = `${apiUrl.replace(/\/+$/, "")}/apiKeys/validate`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "X-API-Key": apiKey },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function displayToast(message: string, color = "rgba(0, 86, 179, 0.7)", duration = 2000) {
  const div = document.createElement("div");
  div.style.cssText = `
    position: fixed; top: 5%; left: 50%; transform: translate(-50%, -50%);
    width: fit-content; min-width: 160px; padding: 12px 20px;
    background-color: ${color}; color: #f2f2f2; font-weight: bold;
    font-size: 16px; border-radius: 25px; z-index: 2147483647;
    box-shadow: 0 0 8px rgba(0,0,0,0.3);
    transition: opacity 0.3s ease; opacity: 0;
    text-align: center;
  `;
  div.textContent = message;
  document.body.prepend(div);

  requestAnimationFrame(() => {
    div.style.opacity = "1";
  });

  setTimeout(() => {
    div.style.opacity = "0";
    setTimeout(() => div.remove(), 300);
  }, duration);
}
