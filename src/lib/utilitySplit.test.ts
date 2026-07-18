import { describe, expect, it } from "vitest";
import { splitByFixedAmount, splitByPercentage, splitEqual } from "./utilitySplit";

describe("splitEqual", () => {
  it("splits evenly divisible totals equally", () => {
    const result = splitEqual(200, ["a", "b", "c", "d"]);
    expect(result).toEqual([
      { unitId: "a", amount: 50 },
      { unitId: "b", amount: 50 },
      { unitId: "c", amount: 50 },
      { unitId: "d", amount: 50 },
    ]);
  });

  it("distributes remainder cents so the sum matches the total exactly", () => {
    const result = splitEqual(100.01, ["a", "b", "c"]);
    const sum = result.reduce((acc, s) => acc + s.amount, 0);
    expect(Math.round(sum * 100) / 100).toBe(100.01);
    // 10001 cents / 3 = 3333 base, remainder 2 cents go to the first two units
    expect(result[0].amount).toBe(33.34);
    expect(result[1].amount).toBe(33.34);
    expect(result[2].amount).toBe(33.33);
  });

  it("throws when there are no units", () => {
    expect(() => splitEqual(100, [])).toThrow();
  });
});

describe("splitByPercentage", () => {
  it("splits proportionally and sums exactly to the total", () => {
    const result = splitByPercentage(150, [
      { unitId: "a", percentage: 50 },
      { unitId: "b", percentage: 30 },
      { unitId: "c", percentage: 20 },
    ]);
    expect(result.map((r) => r.amount)).toEqual([75, 45, 30]);
  });

  it("handles rounding remainders without losing or gaining cents", () => {
    const result = splitByPercentage(100, [
      { unitId: "a", percentage: 33.33 },
      { unitId: "b", percentage: 33.33 },
      { unitId: "c", percentage: 33.34 },
    ]);
    const sum = result.reduce((acc, s) => acc + s.amount, 0);
    expect(Math.round(sum * 100) / 100).toBe(100);
  });

  it("throws when percentages don't sum to 100", () => {
    expect(() =>
      splitByPercentage(100, [
        { unitId: "a", percentage: 40 },
        { unitId: "b", percentage: 40 },
      ])
    ).toThrow(/must sum to 100/);
  });
});

describe("splitByFixedAmount", () => {
  it("passes through amounts that sum to the total", () => {
    const result = splitByFixedAmount(100, [
      { unitId: "a", amount: 60 },
      { unitId: "b", amount: 40 },
    ]);
    expect(result).toEqual([
      { unitId: "a", amount: 60 },
      { unitId: "b", amount: 40 },
    ]);
  });

  it("throws when amounts don't sum to the total", () => {
    expect(() =>
      splitByFixedAmount(100, [
        { unitId: "a", amount: 60 },
        { unitId: "b", amount: 30 },
      ])
    ).toThrow(/must sum to the bill total/);
  });
});
