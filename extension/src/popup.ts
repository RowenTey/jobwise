import { getApiKey, getElementById } from "./shared.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Popup loaded...");
  const usernameEl = getElementById("username");
  const actionBtns = getElementById("actionBtns");

  const apiKey = await getApiKey();

  if (!apiKey) {
    console.log("No API key found");
    usernameEl.textContent = "Not configured";

    const settingsBtn = document.createElement("button");
    settingsBtn.id = "settings";
    settingsBtn.textContent = "Settings";
    settingsBtn.addEventListener("click", () => {
      window.location.href = "settings.html";
    });
    actionBtns.appendChild(settingsBtn);

    return;
  }

  usernameEl.textContent = "API Key set";
  console.log("API key found");

  const settingsBtn = document.createElement("button");
  settingsBtn.id = "settings";
  settingsBtn.textContent = "Settings";
  settingsBtn.addEventListener("click", () => {
    window.location.href = "settings.html";
  });
  actionBtns.appendChild(settingsBtn);

  const appsBtn = document.createElement("button");
  appsBtn.id = "applications";
  appsBtn.textContent = "Applications";
  appsBtn.addEventListener("click", () => {
    window.location.href = "applications.html";
  });
  actionBtns.appendChild(appsBtn);

  const clearBtn = document.createElement("button");
  clearBtn.id = "clearKey";
  clearBtn.textContent = "Clear Key";
  clearBtn.classList.add("delete");
  clearBtn.addEventListener("click", () => {
    chrome.storage.local.remove(["apiUrl", "apiKey", "profile"], () => {
      window.location.reload();
    });
  });
  actionBtns.appendChild(clearBtn);
});
