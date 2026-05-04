import type { SiteExtractor } from "./extractors/base.js";
import { getExtractor } from "./extractors/index.js";
import { displayToast, getApiKey } from "./shared.js";

let isConfigured = false;
let extractor: SiteExtractor;

(async () => {
  console.log("[JobWise] Content script loaded");

  extractor = getExtractor();
  console.log(`[JobWise] Using extractor: ${extractor.siteName}`);

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
  if (!extractor.isApplyButton(target)) return;

  console.log(`[JobWise] Apply button clicked on ${extractor.siteName}:`, target);
  displayToast("Saving job application...");

  const details = extractor.extractJobDetails();
  const payload = {
    source: extractor.siteName,
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

// const EASY_APPLY_SELECTORS = [
//   ".jobs-easy-apply-modal",
//   ".jobs-easy-apply-content",
//   "[data-test-modal='jobs-easy-apply-modal']",
//   "div[aria-label='Easy Apply']",
// ];

// const PROFILE_FIELD_MAP: Record<string, keyof UserProfile> = {
//   name: "name",
//   fullname: "name",
//   "full name": "name",
//   email: "email",
//   phone: "phone",
//   telephone: "phone",
//   "mobile phone": "phone",
//   linkedin: "linkedInUrl",
//   "linkedin url": "linkedInUrl",
//   "linkedin profile": "linkedInUrl",
// };

// async function tryAutoFill(): Promise<void> {
//   const profile = await getProfile();
//   if (!profile) return;

//   const modal = EASY_APPLY_SELECTORS.reduce<HTMLElement | null>(
//     (found, sel) => found || document.querySelector<HTMLElement>(sel),
//     null
//   );
//   if (!modal) return;

//   const inputs = modal.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
//     "input, textarea, select"
//   );

//   for (const input of inputs) {
//     if (input.value) continue;

//     const labelText = getLabelText(modal, input).toLowerCase().trim();
//     const fieldKey = findFieldKey(labelText);
//     if (!fieldKey) continue;

//     const value = profile[fieldKey];
//     if (!value) continue;

//     input.value = value;
//     input.dispatchEvent(new Event("input", { bubbles: true }));
//     input.dispatchEvent(new Event("change", { bubbles: true }));
//   }
// }

// function getLabelText(container: HTMLElement, input: HTMLElement): string {
//   const id = input.id;
//   if (id) {
//     const label = container.querySelector<HTMLLabelElement>(`label[for="${id}"]`);
//     if (label) return label.innerText;
//   }

//   const parent = input.closest<HTMLElement>(".fb-form-element, .artdeco-form-element, label, div");
//   if (parent) {
//     const labelEl = parent.querySelector<HTMLElement>("label, span");
//     if (labelEl) return labelEl.innerText;
//   }

//   return input.getAttribute("placeholder") || input.getAttribute("aria-label") || "";
// }

// function findFieldKey(labelText: string): keyof UserProfile | null {
//   for (const [search, key] of Object.entries(PROFILE_FIELD_MAP)) {
//     if (labelText.includes(search)) return key;
//   }
//   return null;
// }

// const observer = new MutationObserver(() => {
//   if (!isConfigured || extractor.siteName !== "LinkedIn") return;
//   const modal = EASY_APPLY_SELECTORS.reduce<HTMLElement | null>(
//     (found, sel) => found || document.querySelector<HTMLElement>(sel),
//     null
//   );
//   if (modal) {
//     setTimeout(tryAutoFill, 500);
//   }
// });

// observer.observe(document.body, { childList: true, subtree: true });
