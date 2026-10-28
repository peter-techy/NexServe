import { describe, it, expect } from "vitest";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS } from "./types";

describe("Job Applications Types & Statuses", () => {
  it("should have all required candidate statuses", () => {
    expect(APPLICATION_STATUSES).toContain("new");
    expect(APPLICATION_STATUSES).toContain("screening");
    expect(APPLICATION_STATUSES).toContain("interview");
    expect(APPLICATION_STATUSES).toContain("offered");
    expect(APPLICATION_STATUSES).toContain("rejected");
    expect(APPLICATION_STATUSES).toContain("hired");
  });

  it("should provide human-readable labels for all statuses", () => {
    for (const status of APPLICATION_STATUSES) {
      expect(APPLICATION_STATUS_LABELS[status]).toBeDefined();
      expect(APPLICATION_STATUS_LABELS[status].length).toBeGreaterThan(0);
    }
  });
});
