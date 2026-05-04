import type { UserProfile } from "../types.js";
import type { SiteExtractor, JobDetails } from "./base.js";
import { parseJsonLdJobPosting } from "./base.js";

export class LeverExtractor implements SiteExtractor {
  readonly siteName = "Lever";

  isSupported(): boolean {
    return window.location.hostname.includes("lever.co") && window.location.pathname.includes("/jobs/");
  }

  isApplyButton(el: HTMLElement): boolean {
    const text = el.textContent?.toLowerCase().trim() || "";
    return text === "apply for this job" || text === "apply";
  }

  extractJobDetails(): JobDetails {
    const jsonld = parseJsonLdJobPosting();

    const jobTitle = jsonld?.jobTitle
      || document.querySelector<HTMLElement>(".posting-headline h2")?.textContent?.trim()
      || document.querySelector<HTMLElement>("h2[data-qa='job-title']")?.textContent?.trim()
      || document.title.replace(/\s*\|\s*.+$/, "").trim();

    const companyName = jsonld?.companyName
      || this.inferCompanyFromMeta()
      || this.inferCompanyFromUrl();

    const companyUrl = jsonld?.companyUrl || window.location.origin;

    const jobDescription = jsonld?.jobDescription
      || document.querySelector<HTMLElement>(".posting-description")?.textContent?.trim()
      || "";

    const location = jsonld?.location
      || document.querySelector<HTMLElement>(".posting-categories .location")?.textContent?.trim()
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

  private inferCompanyFromMeta(): string {
    const ogSiteName = document.querySelector<HTMLMetaElement>('meta[property="og:site_name"]')?.content;
    return ogSiteName || "";
  }

  private inferCompanyFromUrl(): string {
    const match = window.location.hostname.match(/^([^.]+)\.lever\.co/);
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
