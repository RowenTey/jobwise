import type { SiteExtractor } from "./base.js";
import { FallbackExtractor } from "./base.js";
import { LinkedInExtractor } from "./linkedin.js";

const extractors: SiteExtractor[] = [
    new LinkedInExtractor()
];

export function getExtractor(): SiteExtractor {
    for (const ext of extractors) {
        if (ext.isSupported()) return ext;
    }
    return new FallbackExtractor();
}