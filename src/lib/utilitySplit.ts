export interface UnitSplitAmount {
  unitId: string;
  amount: number;
  percentage?: number;
}

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function toDollars(cents: number): number {
  return cents / 100;
}

/** Equal split across units, remainder cents assigned to the first units so the sum matches the total exactly. */
export function splitEqual(totalAmount: number, unitIds: string[]): UnitSplitAmount[] {
  if (unitIds.length === 0) {
    throw new Error("At least one unit is required to split a bill");
  }
  const totalCents = toCents(totalAmount);
  const baseCents = Math.floor(totalCents / unitIds.length);
  const remainderCents = totalCents - baseCents * unitIds.length;

  return unitIds.map((unitId, i) => ({
    unitId,
    amount: toDollars(baseCents + (i < remainderCents ? 1 : 0)),
  }));
}

/** Percentage split; shares must sum to 100. Remainder cents go to the largest fractional shares first. */
export function splitByPercentage(
  totalAmount: number,
  shares: { unitId: string; percentage: number }[]
): UnitSplitAmount[] {
  if (shares.length === 0) {
    throw new Error("At least one unit is required to split a bill");
  }
  const totalPercentage = shares.reduce((sum, s) => sum + s.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(`Percentages must sum to 100 (got ${totalPercentage})`);
  }

  const totalCents = toCents(totalAmount);
  const raw = shares.map((s) => (totalCents * s.percentage) / 100);
  const floorCents = raw.map(Math.floor);
  const allocated = floorCents.reduce((sum, c) => sum + c, 0);
  const remainder = totalCents - allocated;

  const order = raw
    .map((v, i) => ({ i, frac: v - floorCents[i] }))
    .sort((a, b) => b.frac - a.frac);

  const cents = [...floorCents];
  for (let k = 0; k < remainder; k++) {
    cents[order[k % order.length].i] += 1;
  }

  return shares.map((s, i) => ({
    unitId: s.unitId,
    amount: toDollars(cents[i]),
    percentage: s.percentage,
  }));
}

/** Fixed per-unit amounts; they must sum exactly to the bill total. */
export function splitByFixedAmount(
  totalAmount: number,
  amounts: { unitId: string; amount: number }[]
): UnitSplitAmount[] {
  if (amounts.length === 0) {
    throw new Error("At least one unit is required to split a bill");
  }
  const totalCents = toCents(totalAmount);
  const sumCents = amounts.reduce((sum, a) => sum + toCents(a.amount), 0);
  if (sumCents !== totalCents) {
    throw new Error(
      `Fixed amounts must sum to the bill total ($${totalAmount.toFixed(2)}), got $${toDollars(sumCents).toFixed(2)}`
    );
  }
  return amounts.map((a) => ({ unitId: a.unitId, amount: a.amount }));
}
