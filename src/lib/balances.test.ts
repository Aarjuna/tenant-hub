import { describe, expect, it } from "vitest";
import { Decimal } from "@prisma/client/runtime/client";
import { computeOutstanding } from "./balances";

describe("computeOutstanding", () => {
  it("returns the full amount when there are no payments", () => {
    const result = computeOutstanding(new Decimal(1450), []);
    expect(result.toNumber()).toBe(1450);
  });

  it("subtracts partial payments", () => {
    const result = computeOutstanding(new Decimal(1450), [{ amount: new Decimal(500) }]);
    expect(result.toNumber()).toBe(950);
  });

  it("sums multiple payments", () => {
    const result = computeOutstanding(new Decimal(1450), [
      { amount: new Decimal(500) },
      { amount: new Decimal(200) },
    ]);
    expect(result.toNumber()).toBe(750);
  });

  it("returns zero when fully paid", () => {
    const result = computeOutstanding(new Decimal(1450), [{ amount: new Decimal(1450) }]);
    expect(result.toNumber()).toBe(0);
  });

  it("floors overpayment at zero instead of going negative", () => {
    const result = computeOutstanding(new Decimal(1450), [{ amount: new Decimal(2000) }]);
    expect(result.toNumber()).toBe(0);
  });
});
