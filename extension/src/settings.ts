import { getElementById, getSettings, saveSettings, validateApiKey } from "./shared.js";
import type { ExtensionSettings } from "./types.js";

async function loadSettings(): Promise<void> {
  const apiUrlInput = getElementById<HTMLInputElement>("apiUrl");
  const apiKeyInput = getElementById<HTMLInputElement>("apiKey");
  const nameInput = getElementById<HTMLInputElement>("name");
  const emailInput = getElementById<HTMLInputElement>("email");
  const phoneInput = getElementById<HTMLInputElement>("phone");
  const linkedInInput = getElementById<HTMLInputElement>("linkedInUrl");
  const statusEl = getElementById("statusMessage");

  const settings = await getSettings();
  if (settings) {
    apiUrlInput.value = settings.apiUrl;
    apiKeyInput.value = settings.apiKey;
    nameInput.value = settings.profile.name;
    emailInput.value = settings.profile.email;
    phoneInput.value = settings.profile.phone;
    linkedInInput.value = settings.profile.linkedInUrl;
    statusEl.textContent = "Settings loaded. Update and save to apply changes.";
  }
}

async function handleSave(event: Event): Promise<void> {
  event.preventDefault();

  const submitBtn = getElementById<HTMLButtonElement>("submitBtn");
  const statusEl = getElementById("statusMessage");

  const apiUrl = getElementById<HTMLInputElement>("apiUrl").value.trim();
  const apiKey = getElementById<HTMLInputElement>("apiKey").value.trim();
  const name = getElementById<HTMLInputElement>("name").value.trim();
  const email = getElementById<HTMLInputElement>("email").value.trim();
  const phone = getElementById<HTMLInputElement>("phone").value.trim();
  const linkedInUrl = getElementById<HTMLInputElement>("linkedInUrl").value.trim();

  if (!apiUrl || !apiKey) {
    statusEl.textContent = "API URL and API Key are required.";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Validating...";

  const valid = await validateApiKey(apiUrl, apiKey);

  if (!valid) {
    statusEl.textContent = "API Key validation failed. Check your URL and Key.";
    submitBtn.disabled = false;
    submitBtn.textContent = "Save Settings";
    return;
  }

  const settings: ExtensionSettings = {
    apiUrl,
    apiKey,
    profile: { name, email, phone, linkedInUrl },
  };

  await saveSettings(settings);

  statusEl.textContent = "Settings saved successfully!";
  statusEl.style.color = "#4ade80";
  submitBtn.disabled = false;
  submitBtn.textContent = "Save Settings";

  setTimeout(() => {
    window.location.href = "popup.html";
  }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  getElementById<HTMLFormElement>("settingsForm").addEventListener("submit", handleSave);
  getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "popup.html";
  });
});
