import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";
import type { ApplicationStatus } from "../../types";

const statuses: ApplicationStatus[] = [
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW",
  "REJECTED",
  "OFFERED",
  "GHOSTED",
];

describe("StatusBadge", () => {
  for (const status of statuses) {
    it(`renders '${status}' text`, () => {
      render(<StatusBadge status={status} />);
      expect(screen.getByText(status)).toBeInTheDocument();
    });
  }
});
