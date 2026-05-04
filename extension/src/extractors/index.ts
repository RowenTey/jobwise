import { LinkedInExtractor } from "./linkedin.js";
import { IndeedExtractor } from "./indeed.js";
import { GreenhouseExtractor } from "./greenhouse.js";
import { LeverExtractor } from "./lever.js";
import { FallbackExtractor } from "./base.js";
import type { SiteExtractor } from "./base.js";

const extractors: SiteExtractor[] = [
  new LinkedInExtractor(),
  new IndeedExtractor(),
  new GreenhouseExtractor(),
  new LeverExtractor(),
];

export function getExtractor(): SiteExtractor {
  for (const ext of extractors) {
    if (ext.isSupported()) return ext;
  }
  return new FallbackExtractor();
}
