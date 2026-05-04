import type { UserProfile } from "../types.js";
import type { SiteExtractor, JobDetails } from "./base.js";
import { parseJsonLdJobPosting } from "./base.js";

export class GreenhouseExtractor implements SiteExtractor {
  readonly siteName = "Greenhouse";

  isSupported(): boolean {
    return window.location.hostname.includes("greenhouse.io") && !!window.location.pathname.match(/\/jobs\/\d+/);
  }

  isApplyButton(el: HTMLElement): boolean {
    const text = el.textContent?.toLowerCase().trim() || "";
    return text === "apply" || text === "apply for this job";
  }

  extractJobDetails(): JobDetails {
    const jsonld = parseJsonLdJobPosting();

    const jobTitle = jsonld?.jobTitle
      || document.querySelector<HTMLElement>("#header h1")?.textContent?.trim()
      || document.querySelector<HTMLElement>(".title")?.textContent?.trim()
      || document.title.replace(/\s*\|\s*.+$/, "").trim();

    const companyName = jsonld?.companyName
      || document.querySelector<HTMLElement>(".company-name")?.textContent?.trim()
      || this.inferCompanyFromUrl();

    const companyUrl = jsonld?.companyUrl || window.location.origin;

    const jobDescription = jsonld?.jobDescription
      || document.querySelector<HTMLElement>("#content")?.textContent?.trim()
      || document.querySelector<HTMLElement>(".job-description")?.textContent?.trim()
      || "";

    const location = jsonld?.location
      || document.querySelector<HTMLElement>(".location")?.textContent?.trim()
      || "";

    const jobType = jsonld?.jobType || this.inferJobTypeFromPage(jobTitle);

    return {
      jobTitle,
      jobDescription,
      applicationUrl: window.location.href,
      companyName: companyName || this.inferCompanyFromUrl(),
      companyUrl,
      jobType,
      location,
    };
  }

  getAutoFillSelectors(): string[] {
    return [];
  }

  resolveFieldKey(_modal: HTMLElement, _input: HTMLElement): keyof UserProfile | null {
    return null;
  }

  private inferCompanyFromUrl(): string {
    const match = window.location.hostname.match(/^([^.]+)\.greenhouse\.io/);
    if (match) {
      return match[1].charAt(0).toUpperCase() + match[1].slice(1);
    }
    return "";
  }

  private inferJobTypeFromPage(title: string): string {
    const t = title.toLowerCase();
    if (t.includes("intern")) return "INTERNSHIP";
    if (t.includes("contract")) return "CONTRACT";
    if (t.includes("part")) return "PART_TIME";

    for (const el of document.querySelectorAll<HTMLElement>("*")) {
      const text = el.textContent?.toLowerCase().trim() || "";
      if (text === "full-time" || text === "full time") return "FULL_TIME";
      if (text === "part-time" || text === "part time") return "PART_TIME";
      if (text === "contract") return "CONTRACT";
      if (text === "internship") return "INTERNSHIP";
    }
    return "FULL_TIME";
  }
}
