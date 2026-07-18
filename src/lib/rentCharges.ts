import { addMonths, isAfter, lastDayOfMonth, setDate, startOfMonth } from "date-fns";
import { UTCDate } from "@date-fns/utc";
import { db } from "@/lib/db";

// All calendar-date math here runs in UTC (via UTCDate) rather than the server's local
// timezone, so period boundaries don't shift depending on where this process runs.
function dueDateForPeriod(periodStart: Date, dueDay: number): Date {
  const lastDay = lastDayOfMonth(periodStart).getUTCDate();
  return setDate(periodStart, Math.min(dueDay, lastDay));
}

/** Idempotently creates a RentCharge for every billing period from lease start through `asOf`. */
export async function ensureRentChargesForLease(leaseId: string, asOf: Date = new Date()): Promise<void> {
  const lease = await db.lease.findUniqueOrThrow({ where: { id: leaseId } });
  if (lease.status !== "ACTIVE") return;

  const asOfUtc = new UTCDate(asOf);
  const startDateUtc = new UTCDate(lease.startDate);
  const endDateUtc = lease.endDate ? new UTCDate(lease.endDate) : null;

  const cutoffDate = endDateUtc && isAfter(asOfUtc, endDateUtc) ? endDateUtc : asOfUtc;
  const cutoff = startOfMonth(cutoffDate);

  let periodStart = startOfMonth(startDateUtc);
  while (!isAfter(periodStart, cutoff)) {
    await db.rentCharge.upsert({
      where: { leaseId_periodStart: { leaseId, periodStart } },
      update: {},
      create: {
        leaseId,
        periodStart,
        dueDate: dueDateForPeriod(periodStart, lease.dueDay),
        amount: lease.rentAmount,
      },
    });
    periodStart = addMonths(periodStart, 1);
  }
}

export async function ensureRentChargesForAllActiveLeases(asOf: Date = new Date()): Promise<void> {
  const leases = await db.lease.findMany({ where: { status: "ACTIVE" } });
  for (const lease of leases) {
    await ensureRentChargesForLease(lease.id, asOf);
  }
}
