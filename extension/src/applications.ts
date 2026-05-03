import { getElementById, fetchApplications, displayToast } from "./shared.js";
import type { ApplicationDto } from "./types.js";

function base64Encode(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return btoa(String.fromCharCode(...new Uint8Array(data)));
}

function createCard(app: ApplicationDto): HTMLElement {
  const card = document.createElement("div");
  card.className = "card";

  const heading = document.createElement("h3");
  heading.textContent = app.job.title;

  const company = document.createElement("p");
  company.textContent = app.job.company.name;

  const status = document.createElement("span");
  status.className = `status-badge status-${app.status.toLowerCase()}`;
  status.textContent = app.status;

  card.appendChild(heading);
  card.appendChild(company);
  card.appendChild(status);

  card.addEventListener("click", () => {
    const encoded = base64Encode(JSON.stringify({ id: app.id }));
    window.location.href = `application.html?data=${encoded}`;
  });

  return card;
}

document.addEventListener("DOMContentLoaded", async () => {
  const label = getElementById("applicationsLabel");
  const loading = getElementById<HTMLDivElement>("loading");
  const container = getElementById("cardsContainer");

  label.textContent = "Loading applications...";
  loading.style.display = "block";

  try {
    const apps = await fetchApplications();

    loading.style.display = "none";

    if (apps.length === 0) {
      label.textContent = "No applications yet.";
      return;
    }

    for (const app of apps) {
      container.appendChild(createCard(app));
    }

    label.textContent = "Select an application to update";
  } catch (err) {
    loading.style.display = "none";
    label.textContent = "Failed to load applications";
    console.error("[JobWise]", err);
    displayToast("Failed to load applications", "rgba(200, 50, 50, 0.7)");
  }
});

getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "popup.html";
});
