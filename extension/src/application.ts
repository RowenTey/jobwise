import {
  getElementById,
  fetchApplications,
  updateApplicationStatus,
  displayToast,
} from "./shared.js";
import type { ApplicationDto, ApplicationStatus } from "./types.js";

function base64Decode(base64: string): string {
  const binary = atob(base64);
  const data = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    data[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(data);
}

async function loadApplication(id: number): Promise<ApplicationDto> {
  const apps = await fetchApplications();
  const app = apps.find((a) => a.id === id);
  if (!app) throw new Error("Application not found");
  return app;
}

function renderJobCard(app: ApplicationDto): void {
  const container = getElementById("jobContainer");

  const title = document.createElement("h2");
  title.textContent = `${app.job.title} at ${app.job.company.name}`;
  container.appendChild(title);

  const fields: [string, string | number | null][] = [
    ["Status", app.status],
    ["Job Type", app.job.jobType],
    ["Location", app.job.location],
    ["Source", app.source],
    ["Notes", app.notes || "N/A"],
    ["Last Updated", new Date(app.lastUpdated).toLocaleDateString()],
  ];

  for (const [label, value] of fields) {
    if (!value) continue;
    const p = document.createElement("p");
    p.textContent = `${label}: ${value}`;
    container.appendChild(p);
  }

  if (app.job.externalUrl) {
    const linkP = document.createElement("p");
    const link = document.createElement("a");
    link.href = app.job.externalUrl;
    link.target = "_blank";
    link.textContent = "View Job Posting";
    linkP.appendChild(link);
    container.appendChild(linkP);
  }
}

function renderStatusForm(app: ApplicationDto): void {
  const container = getElementById("statusFormContainer");

  const statuses: ApplicationStatus[] = [
    "VIEWED",
    "APPLIED",
    "ASSESSMENT",
    "INTERVIEW",
    "REJECTED",
    "OFFERED",
    "GHOSTED",
  ];

  const label = document.createElement("label");
  label.htmlFor = "statusSelect";
  label.textContent = "Update Status:";
  container.appendChild(label);

  const select = document.createElement("select");
  select.id = "statusSelect";

  for (const s of statuses) {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s.charAt(0) + s.slice(1).toLowerCase();
    if (s === app.status) opt.selected = true;
    select.appendChild(opt);
  }

  container.appendChild(select);

  const updateBtn = document.createElement("button");
  updateBtn.id = "updateBtn";
  updateBtn.textContent = "Update Status";
  container.appendChild(updateBtn);

  updateBtn.addEventListener("click", async () => {
    const newStatus = select.value as ApplicationStatus;
    if (newStatus === app.status) {
      displayToast("Status unchanged.");
      return;
    }

    updateBtn.disabled = true;
    updateBtn.textContent = "Updating...";

    try {
      await updateApplicationStatus(app.id, newStatus);
      displayToast("Status updated!");
      setTimeout(() => {
        window.location.href = "applications.html";
      }, 1000);
    } catch (err) {
      console.error("[JobWise] Failed to update status:", err);
      displayToast("Failed to update status", "rgba(200, 50, 50, 0.7)");
      updateBtn.disabled = false;
      updateBtn.textContent = "Update Status";
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const dataParam = params.get("data");

  if (!dataParam) {
    getElementById("jobContainer").textContent = "No application data provided.";
    return;
  }

  try {
    const decoded = JSON.parse(base64Decode(dataParam));
    const appId = Number(decoded.id);

    if (!appId) {
      getElementById("jobContainer").textContent = "Invalid application ID.";
      return;
    }

    const app = await loadApplication(appId);

    renderJobCard(app);
    renderStatusForm(app);

    getElementById("applicationsLabel").textContent = "Update Application Status";
  } catch (err) {
    console.error("[JobWise]", err);
    getElementById("jobContainer").textContent = "Failed to load application.";
  }
});

getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "applications.html";
});
