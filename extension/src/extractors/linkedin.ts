import type { UserProfile } from "../types.js";
import type { SiteExtractor, JobDetails } from "./base.js";

export class LinkedInExtractor implements SiteExtractor {
  readonly siteName = "LinkedIn";

  isSupported(): boolean {
    return window.location.hostname.includes("linkedin.com");
  }

  isApplyButton(el: HTMLElement): boolean {
    const text = el.textContent?.toLowerCase() || "";
    return text.includes("apply");
  }

  extractJobDetails(): JobDetails {
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
      applicationUrl = this.extractUrlFromLinkedInRedirect(externalLink.href);
    }

    return { jobTitle, jobDescription, applicationUrl, companyName, companyUrl, jobType, location };
  }

  private extractUrlFromLinkedInRedirect(url: string): string {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("linkedin.com") && parsed.pathname === "/safety/go/") {
        const dest = parsed.searchParams.get("url");
        if (dest) return decodeURIComponent(dest);
      }
    } catch {
      // ignore invalid URLs
    }
    return url;
  }

  getAutoFillSelectors(): string[] {
    return [
      ".jobs-easy-apply-modal",
      ".jobs-easy-apply-content",
      "[data-test-modal='jobs-easy-apply-modal']",
      "div[aria-label='Easy Apply']",
    ];
  }

  resolveFieldKey(modal: HTMLElement, input: HTMLElement): keyof UserProfile | null {
    const labelText = this.getLabelText(modal, input).toLowerCase().trim();
    for (const [search, key] of Object.entries(PROFILE_FIELD_MAP)) {
      if (labelText.includes(search)) return key;
    }
    return null;
  }

  private getLabelText(container: HTMLElement, input: HTMLElement): string {
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
