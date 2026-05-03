function displayToast(message: string, color = "rgba(0, 86, 179, 0.7)", duration = 2000) {
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

const KEYS = {
  API_URL: "apiUrl",
  API_KEY: "apiKey",
  PROFILE: "profile",
} as const;

function getApiKey(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(KEYS.API_KEY, (result: Record<string, unknown>) => {
      resolve((result[KEYS.API_KEY] as string) ?? null);
    });
  });
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  linkedInUrl: string;
}

function getProfile(): Promise<UserProfile | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(KEYS.PROFILE, (result: Record<string, unknown>) => {
      resolve((result[KEYS.PROFILE] as UserProfile) ?? null);
    });
  });
}

let isConfigured = false;

(async () => {
  console.log("[JobWise] Content script loaded");

  const apiKey = await getApiKey();
  if (apiKey) {
    isConfigured = true;
    displayToast("JobWise is active!");
  } else {
    displayToast("Please configure JobWise in extension settings.", "rgba(200, 50, 50, 0.7)");
  }
})();

document.addEventListener("click", async (event) => {
  console.log("[JobWise] Click event:", event);
  if (!isConfigured) return;

  const target = event.target as HTMLElement;
  if (!isApplyButton(target)) return;

  console.log("[JobWise] Apply button clicked:", target);
  displayToast("Saving job application...");

  const details = extractJobDetails();
  const payload = {
    source: "LinkedIn",
    company: {
      name: details.companyName,
      website: details.companyUrl || undefined,
    },
    job: {
      title: details.jobTitle,
      description: details.jobDescription || "No description available",
      location: details.location || undefined,
      jobType: details.jobType,
      externalUrl: details.applicationUrl,
    },
  };
  console.log("[JobWise] Extracted job details:", payload);

  chrome.runtime.sendMessage(
    { type: "SAVE_JOB", payload: payload },
    function (response) {
      if (response.success) {
        console.log("[JobWise] Job saved successfully");
        displayToast("Job application saved!");
      } else {
        console.log("[JobWise] Failed to save job");
        displayToast("Failed to save job!", "rgba(200, 50, 50, 0.7)");
      }
    }
  );
}, true);

function isApplyButton(el: HTMLElement): boolean {
  const text = el.textContent?.toLowerCase() || "";
  return text.includes("apply");
}

interface JobDetails {
  jobTitle: string;
  jobDescription: string;
  applicationUrl: string;
  companyName: string;
  companyUrl: string;
  jobType: string;
  location: string;
}

function extractUrlFromLinkedInRedirect(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("linkedin.com") && parsed.pathname === "/safety/go/") {
      const dest = parsed.searchParams.get("url");
      if (dest) return decodeURIComponent(dest);
    }
  } catch { }
  return url;
}

function extractJobDetails(): JobDetails {
  const allJobLinks = document.querySelectorAll<HTMLAnchorElement>('a[href*="/jobs/view/"]');
  let jobTitle = "";
  let applicationUrl = window.location.href;
  let bestLen = 0;
  for (const link of allJobLinks) {
    const text = link.textContent?.trim() || "";
    if (text.length > bestLen) {
      bestLen = text.length;
      jobTitle = text;
      applicationUrl = link.href;
    }
  }
  if (!jobTitle) {
    jobTitle = document.title.replace(/\s*\|\s*LinkedIn.*$/, "").trim();
  }

  const companyLabel = document.querySelector<HTMLElement>('[aria-label*="Company,"]');
  let companyName = "";
  let companyUrl = "";
  if (companyLabel) {
    const anchor = companyLabel.querySelector<HTMLAnchorElement>('a[href*="/company/"]');
    if (anchor) {
      companyName = anchor.textContent?.trim() || "";
      companyUrl = anchor.href;
    }
  }
  if (!companyName) {
    for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href*="/company/"]')) {
      if (!link.href.includes("/jobs/")) {
        companyName = link.textContent?.trim() || "";
        companyUrl = link.href;
        if (companyName) break;
      }
    }
  }

  const descriptionEl = document.querySelector<HTMLElement>('[data-testid="expandable-text-box"]');
  let jobDescription = descriptionEl?.textContent?.trim() || "";
  jobDescription = jobDescription.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "");

  let location = "";
  for (const p of document.querySelectorAll<HTMLElement>("p")) {
    const text = p.textContent || "";
    if (text.includes("·") && (text.includes("ago") || text.includes("reposted") || text.includes("clicked apply") || text.includes("applicants"))) {
      const span = p.querySelector<HTMLSpanElement>("span");
      if (span) {
        const t = span.textContent?.trim() || "";
        if (t && !t.includes("·") && !t.includes("ago")) {
          location = t;
          break;
        }
      }
    }
  }

  let jobType = "FULL_TIME";
  for (const span of document.querySelectorAll<HTMLSpanElement>("span")) {
    const t = span.textContent?.toLowerCase().trim() || "";
    if (t === "internship") { jobType = "INTERNSHIP"; break; }
    if (t === "part-time" || t === "part time") { jobType = "PART_TIME"; break; }
    if (t === "contract") { jobType = "CONTRACT"; break; }
  }
  if (jobType === "FULL_TIME" && jobTitle.toLowerCase().includes("intern")) {
    jobType = "INTERNSHIP";
  }

  const externalLink = document.querySelector<HTMLAnchorElement>(
    'a[aria-label="Apply on company website"], a[href*="/safety/go/"]'
  );
  if (externalLink) {
    applicationUrl = extractUrlFromLinkedInRedirect(externalLink.href);
  }

  return { jobTitle, jobDescription, applicationUrl, companyName, companyUrl, jobType, location };
}

const PROFILE_FIELD_MAP: Record<string, keyof UserProfile> = {
  name: "name",
  fullname: "name",
  "full name": "name",
  email: "email",
  phone: "phone",
  telephone: "phone",
  "mobile phone": "phone",
  linkedin: "linkedInUrl",
  "linkedin url": "linkedInUrl",
  "linkedin profile": "linkedInUrl",
};

const EASY_APPLY_SELECTORS = [
  ".jobs-easy-apply-modal",
  ".jobs-easy-apply-content",
  "[data-test-modal='jobs-easy-apply-modal']",
  "div[aria-label='Easy Apply']",
];

async function tryAutoFill(): Promise<void> {
  const profile = await getProfile();
  if (!profile) return;

  const modal = EASY_APPLY_SELECTORS.reduce<HTMLElement | null>(
    (found, sel) => found || document.querySelector<HTMLElement>(sel),
    null
  );
  if (!modal) return;

  const inputs = modal.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input, textarea, select"
  );

  for (const input of inputs) {
    if (input.value) continue;

    const labelText = getLabelText(modal, input).toLowerCase().trim();
    const fieldKey = findFieldKey(labelText);
    if (!fieldKey) continue;

    const value = profile[fieldKey];
    if (!value) continue;

    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function getLabelText(container: HTMLElement, input: HTMLElement): string {
  const id = input.id;
  if (id) {
    const label = container.querySelector<HTMLLabelElement>(`label[for="${id}"]`);
    if (label) return label.innerText;
  }

  const parent = input.closest<HTMLElement>(".fb-form-element, .artdeco-form-element, label, div");
  if (parent) {
    const labelEl = parent.querySelector<HTMLElement>("label, span");
    if (labelEl) return labelEl.innerText;
  }

  return input.getAttribute("placeholder") || input.getAttribute("aria-label") || "";
}

function findFieldKey(labelText: string): keyof UserProfile | null {
  for (const [search, key] of Object.entries(PROFILE_FIELD_MAP)) {
    if (labelText.includes(search)) return key;
  }
  return null;
}

const observer = new MutationObserver(() => {
  if (!isConfigured) return;
  const modal = EASY_APPLY_SELECTORS.reduce<HTMLElement | null>(
    (found, sel) => found || document.querySelector<HTMLElement>(sel),
    null
  );
  if (modal) {
    setTimeout(tryAutoFill, 500);
  }
});

observer.observe(document.body, { childList: true, subtree: true });
