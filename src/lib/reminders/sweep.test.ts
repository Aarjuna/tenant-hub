import { describe, expect, it } from "vitest";
import { classifyDueDate, reminderTypeFor } from "./sweep";

const TODAY = new Date("2026-07-15T12:00:00Z");

describe("classifyDueDate", () => {
  it("classifies a past due date as overdue", () => {
    expect(classifyDueDate(new Date("2026-07-10T00:00:00Z"), TODAY)).toBe("overdue");
  });

  it("classifies today as due soon", () => {
    expect(classifyDueDate(new Date("2026-07-15T00:00:00Z"), TODAY)).toBe("due_soon");
  });

  it("classifies a date within the due-soon window as due soon", () => {
    expect(classifyDueDate(new Date("2026-07-18T00:00:00Z"), TODAY)).toBe("due_soon");
  });

  it("treats the exact edge of the window as due soon", () => {
    // default window is 3 days
    expect(classifyDueDate(new Date("2026-07-18T00:00:00Z"), TODAY, 3)).toBe("due_soon");
  });

  it("classifies a date beyond the window as not due", () => {
    expect(classifyDueDate(new Date("2026-07-19T00:00:00Z"), TODAY, 3)).toBe("not_due");
  });
});

describe("reminderTypeFor", () => {
  it("returns RENT_OVERDUE for an overdue rent line", () => {
    expect(reminderTypeFor({ kind: "rent" }, true)).toBe("RENT_OVERDUE");
  });

  it("returns RENT_DUE_SOON for a due-soon rent line", () => {
    expect(reminderTypeFor({ kind: "rent" }, false)).toBe("RENT_DUE_SOON");
  });

  it("returns UTILITY_OVERDUE for an overdue utility line", () => {
    expect(reminderTypeFor({ kind: "utility" }, true)).toBe("UTILITY_OVERDUE");
  });

  it("returns UTILITY_DUE_SOON for a due-soon utility line", () => {
    expect(reminderTypeFor({ kind: "utility" }, false)).toBe("UTILITY_DUE_SOON");
  });
});
