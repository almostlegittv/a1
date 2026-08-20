import { describe, expect, it } from "vitest";
import { filterAndSortApplications } from "./adminApplicationQueue";

const applications = [
  { displayName: "Zeta", requestedSlug: "zeta", applicantName: "Ava", applicantEmail: "ava@example.com", status: "pending" as const, createdAt: "2026-08-18T00:00:00Z" },
  { displayName: "Alpha", requestedSlug: "alpha", applicantName: "Ben", applicantEmail: "ben@example.com", status: "approved" as const, createdAt: "2026-08-19T00:00:00Z" },
];

describe("admin application queue", () => {
  it("filters by creator identity and status", () => {
    expect(filterAndSortApplications(applications, "ava", "pending", "newest")).toHaveLength(1);
    expect(filterAndSortApplications(applications, "ava", "approved", "newest")).toHaveLength(0);
  });

  it("sorts by creator name", () => {
    expect(filterAndSortApplications(applications, "", "all", "name").map((item) => item.displayName)).toEqual(["Alpha", "Zeta"]);
  });

  it("sorts newest first by default", () => {
    expect(filterAndSortApplications(applications, "", "all", "newest")[0].displayName).toBe("Alpha");
  });
});
