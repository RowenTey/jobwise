import type { UserProfile } from "../types.js";
import type { SiteExtractor, JobDetails } from "./base.js";
import { parseJsonLdJobPosting } from "./base.js";

export class IndeedExtractor implements SiteExtractor {
  readonly siteName = "Indeed";

  isSupported(): boolean {
    return window.location.hostname.includes("indeed.com");
  }

  isApplyButton(el: HTMLElement): boolean {
    const text = el.textContent?.toLowerCase() || "";
    return text.includes("apply now") || text.includes("apply with indeed") || text.includes("apply on company site");
  }

  extractJobDetails(): JobDetails {
    const jsonld = parseJsonLdJobPosting();

    const jobTitle = jsonld?.jobTitle
      || document.querySelector<HTMLElement>("h1")?.textContent?.trim()
      || document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content
      || document.title.replace(/\s*\|\s*.+$/, "").trim();

    const companyName = jsonld?.companyName
      || document.querySelector<HTMLElement>("[data-testid='company-name']")?.textContent?.trim()
      || document.querySelector<HTMLElement>("[data-company-name]")?.textContent?.trim()
      || "";

    const companyUrl = jsonld?.companyUrl || "";

    const jobDescription = jsonld?.jobDescription
      || document.querySelector<HTMLElement>("#jobDescriptionText")?.textContent?.trim()
      || document.querySelector<HTMLElement>("[data-testid='jobDescriptionText']")?.textContent?.trim()
      || "";

    const location = jsonld?.location
      || document.querySelector<HTMLElement>("[data-testid='inlineHeader-companyLocation']")?.textContent?.trim()
      || document.querySelector<HTMLElement>(".jobsearch-JobInfoHeader-subtitle")?.textContent?.trim()
      || "";

    const jobType = jsonld?.jobType || this.inferJobTypeFromPage(jobTitle);

    return {
      jobTitle,
      jobDescription,
      applicationUrl: window.location.href,
      companyName,
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
