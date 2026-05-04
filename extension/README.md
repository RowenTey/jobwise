# JobWise Browser Extension

Browser extension for saving job applications to JobWise from supported job boards.

## Stack

- **Language**: TypeScript
- **Build**: `tsc --noEmit` (type-check) + `esbuild --bundle` (IIFE output)
- **Runtime**: Manifest V3 (Chrome & Firefox)

## Quick Start

```bash
cd extension
npm install
npm run build    # type-check + bundle
```

Output goes to `dist/`. Load the extension via `about:debugging` (Firefox) or `chrome://extensions` with developer mode enabled.

## Build Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Type-check via `tsc`, then bundle all entry points to `dist/` via `esbuild` |
| `npm run watch` | Watch mode: `esbuild` re-bundles on file changes |

Entry points bundled: `content.ts`, `background.ts`, `popup.ts`, `settings.ts`, `applications.ts`, `application.ts`.

## Project Structure

```
extension/
├── src/
│   ├── content.ts              # Content script entry point (delegates to extractors)
│   ├── background.ts           # Service worker / background script
│   ├── popup.ts                # Extension popup UI
│   ├── settings.ts             # Settings page (API URL, API Key, profile)
│   ├── applications.ts         # Applications list page
│   ├── application.ts          # Application detail page
│   ├── shared.ts               # Shared utilities (storage, API, toast)
│   ├── types.ts                # Shared TypeScript types
│   └── extractors/             # Pluggable site extractors
│       ├── base.ts             # SiteExtractor interface, FallbackExtractor, JSON-LD utils
│       ├── linkedin.ts         # LinkedIn extractor
│       ├── indeed.ts           # Indeed extractor
│       ├── greenhouse.ts       # Greenhouse extractor
│       ├── lever.ts            # Lever extractor
│       └── index.ts            # Registry: hostname → extractor
├── templates/                  # HTML pages for the extension
│   ├── popup.html
│   ├── settings.html
│   ├── applications.html
│   └── application.html
├── css/
│   └── index.css
├── manifest.json               # Firefox manifest
├── manifest.chrome.json        # Chrome manifest
├── tsconfig.json
└── package.json
```

## Supported Sites

| Site | URL Pattern | Apply Button Detection | Auto-Fill |
|------|-------------|----------------------|-----------|
| LinkedIn | `linkedin.com/jobs/*` | Text contains "apply" | Yes (Easy Apply modal) |
| Indeed | `*.indeed.com/*` | "Apply now", "Apply with Indeed" | No |
| Greenhouse | `boards.greenhouse.io/jobs/*` | Exact text "Apply" or "Apply for this job" | No |
| Lever | `jobs.lever.co/jobs/*` | "Apply for this job" or "Apply" | No |
| Other sites | Any | Generic text heuristic | No |

All extractors attempt JSON-LD `JobPosting` schema parsing before falling back to DOM selectors.

## Extractor Architecture

The content script uses a **pluggable extractor pattern** to support multiple job boards:

```
content.ts               # Entry: detects site, wires click/MutationObserver
  └── getExtractor()     # Registry in extractors/index.ts
        ├── LinkedInExtractor   (hostname includes "linkedin.com")
        ├── IndeedExtractor     (hostname includes "indeed.com")
        ├── GreenhouseExtractor (hostname includes "greenhouse.io" + /jobs/\d+)
        ├── LeverExtractor      (hostname includes "lever.co" + /jobs/)
        └── FallbackExtractor   (always matches — last resort)
```

Each extractor implements the `SiteExtractor` interface:

```typescript
interface SiteExtractor {
  readonly siteName: string;
  isSupported(): boolean;
  isApplyButton(el: HTMLElement): boolean;
  extractJobDetails(): JobDetails;
  getAutoFillSelectors(): string[];
  resolveFieldKey(modal: HTMLElement, input: HTMLElement): keyof UserProfile | null;
}
```

Clicking an apply button triggers `extractJobDetails()` → builds an `ApplicationCreateRequest` → `chrome.runtime.sendMessage` → background POSTs to the JobWise API.

## Adding a New Site

1. Create a new file in `src/extractors/` (e.g. `ziprecruiter.ts`)
2. Implement the `SiteExtractor` interface:
   - `isSupported()` — check `window.location.hostname`
   - `isApplyButton()` — check click target text
   - `extractJobDetails()` — scrape title, company, description, etc.
   - `getAutoFillSelectors()` + `resolveFieldKey()` — return empty/default if no auto-fill
3. Add the extractor to the array in `src/extractors/index.ts`
4. Add the URL pattern to both `manifest.json` and `manifest.chrome.json`
5. Run `npm run build` to verify

Example:

```typescript
export class ZipRecruiterExtractor implements SiteExtractor {
  readonly siteName = "ZipRecruiter";

  isSupported(): boolean {
    return window.location.hostname.includes("ziprecruiter.com");
  }

  isApplyButton(el: HTMLElement): boolean {
    const text = el.textContent?.toLowerCase() || "";
    return text.includes("apply") || text.includes("easy apply");
  }

  extractJobDetails(): JobDetails {
    const jsonld = parseJsonLdJobPosting();
    // ... DOM fallbacks ...
  }

  getAutoFillSelectors(): string[] { return []; }
  resolveFieldKey(): keyof UserProfile | null { return null; }
}
```

## JSON-LD Parsing

The shared utility `parseJsonLdJobPosting()` in `base.ts` extracts job data from `<script type="application/ld+json">` with `@type: "JobPosting"`. It maps `employmentType` to the internal `JobType` enum:
- `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP`

This is used as the primary data source by all extractors, with DOM selectors as fallback.

## Auto-Fill

Currently only supports LinkedIn Easy Apply. When a modal matching LinkedIn's selectors appears (detected via `MutationObserver`), the extension fills stored profile fields (name, email, phone, LinkedIn URL) into matching form inputs by label text.

## Known Limitations

- Workday job listings are handled by the generic `FallbackExtractor` (meta tags + JSON-LD only; no reliable DOM selectors)
- Apply button clicks that navigate away from the page (e.g., Greenhouse → external application) may lose the response callback, but the message is delivered before navigation
- No auto-fill for Indeed, Greenhouse, or Lever application forms
- `isApplyButton()` is heuristic-based; false positives/negatives possible on uncommon site layouts

## Browser-Specific Manifests

| Manifest | Browser | Background | Permissions |
|----------|---------|------------|-------------|
| `manifest.json` | Firefox | `background.scripts` | `storage`, `activeTab` |
| `manifest.chrome.json` | Chrome | `background.service_worker` | `storage`, explicit `host_permissions` |

Chrome requires explicit `host_permissions` for content script injection on each site. Firefox uses `activeTab` for temporary access on user-triggered actions.

## Development

```bash
npm run build      # Full build
npm run watch      # Auto-rebuild on changes
```

After building, load the unpacked extension:

- **Firefox**: `about:debugging` → This Firefox → Load Temporary Add-on → select `manifest.json`
- **Chrome**: `chrome://extensions` → Developer mode → Load unpacked → select `extension/` directory
