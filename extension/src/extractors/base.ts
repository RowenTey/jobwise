import type { UserProfile } from "../types.js";

export interface JobDetails {
  jobTitle: string;
  jobDescription: string;
  applicationUrl: string;
  companyName: string;
  companyUrl: string;
  jobType: string;
  location: string;
}

export interface SiteExtractor {
  readonly siteName: string;
  isSupported(): boolean;
  isApplyButton(el: HTMLElement): boolean;
  extractJobDetails(): JobDetails;
  getAutoFillSelectors(): string[];
  resolveFieldKey(modal: HTMLElement, input: HTMLElement): keyof UserProfile | null;
}

export function parseJsonLdJobPosting(): Partial<JobDetails> | null {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || "");
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item["@type"] !== "JobPosting") continue;
        const title = item.title || "";
        const description = (item.description || "").replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "");
        const companyName = item.hiringOrganization?.name || "";
        const companyUrl = item.hiringOrganization?.sameAs || "";
        const location = item.jobLocation?.address?.addressLocality || item.jobLocation?.addressLocality || "";
        const employmentType = item.employmentType || "";
        const url = item.url || "";

        let jobType = "FULL_TIME";
        const t = employmentType.toUpperCase();
        if (t.includes("PART")) jobType = "PART_TIME";
        else if (t.includes("CONTRACT") || t.includes("TEMP")) jobType = "CONTRACT";
        else if (t.includes("INTERN")) jobType = "INTERNSHIP";

        return { jobTitle: title, jobDescription: description, companyName, companyUrl, location, jobType, applicationUrl: url };
      }
    } catch {
      // skip invalid JSON-LD
    }
  }
  return null;
}

function inferJobTypeFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("intern")) return "INTERNSHIP";
  if (t.includes("contract")) return "CONTRACT";
  if (t.includes("part") && t.includes("time")) return "PART_TIME";
  return "FULL_TIME";
}

export class FallbackExtractor implements SiteExtractor {
  readonly siteName = "Other";

  isSupported(): boolean {
    return true;
  }

  isApplyButton(el: HTMLElement): boolean {
    const text = el.textContent?.toLowerCase() || "";
    return text.includes("apply") && !text.includes("how to apply") && !text.includes("applied");
  }

  extractJobDetails(): JobDetails {
    const jsonld = parseJsonLdJobPosting();

    const jobTitle = jsonld?.jobTitle
      || document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content
      || document.title.replace(/\s*\|\s*.+$/, "").trim();

    const jobDescription = jsonld?.jobDescription
      || document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.content
      || document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content
      || "";

    const companyName = jsonld?.companyName || this.inferCompanyFromHost();

    const location = jsonld?.location || "";

    const jobType = jsonld?.jobType || inferJobTypeFromTitle(jobTitle);

    const companyUrl = jsonld?.companyUrl || window.location.origin;

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

  private inferCompanyFromHost(): string {
    const host = window.location.hostname;
    const parts = host.replace("www.", "").split(".");
    if (parts.length >= 2) {
      const name = parts[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return host;
  }
}
