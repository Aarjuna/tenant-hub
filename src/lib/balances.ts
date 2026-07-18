import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { ensureRentChargesForLease } from "@/lib/rentCharges";
import { formatCalendarDate } from "@/lib/formatDate";

export type BalanceLineKind = "rent" | "utility";

export interface BalanceLine {
  kind: BalanceLineKind;
  id: string; // RentCharge.id or UtilityBillSplit.id
  tenantId: string;
  label: string;
  propertyName: string;
  unitLabel: string;
  dueDate: Date;
  amount: Prisma.Decimal;
  outstanding: Prisma.Decimal;
}

function sumPayments(payments: { amount: Prisma.Decimal }[]): Prisma.Decimal {
  return payments.reduce((sum, p) => sum.plus(p.amount), new Prisma.Decimal(0));
}

/** Outstanding balance for a single charge/split, floored at zero (overpayment isn't tracked as credit in v1). */
export function computeOutstanding(
  amount: Prisma.Decimal,
  payments: { amount: Prisma.Decimal }[]
): Prisma.Decimal {
  const remaining = amount.minus(sumPayments(payments));
  return remaining.isNegative() ? new Prisma.Decimal(0) : remaining;
}

export async function getTenantBalance(tenantId: string): Promise<{
  lines: BalanceLine[];
  totalOutstanding: Prisma.Decimal;
}> {
  const activeLeases = await db.lease.findMany({ where: { tenantId, status: "ACTIVE" } });
  for (const lease of activeLeases) {
    await ensureRentChargesForLease(lease.id);
  }
  const unitIds = activeLeases.map((l) => l.unitId);

  const [rentCharges, utilitySplits] = await Promise.all([
    db.rentCharge.findMany({
      where: { lease: { tenantId } },
      include: {
        payments: true,
        lease: { include: { unit: { include: { property: true } } } },
      },
      orderBy: { dueDate: "asc" },
    }),
    unitIds.length
      ? db.utilityBillSplit.findMany({
          where: { unitId: { in: unitIds } },
          include: {
            payments: true,
            unit: { include: { property: true } },
            utilityBill: true,
          },
          orderBy: { utilityBill: { dueDate: "asc" } },
        })
      : Promise.resolve([]),
  ]);

  const lines: BalanceLine[] = [];

  for (const charge of rentCharges) {
    const outstanding = computeOutstanding(charge.amount, charge.payments);
    if (outstanding.greaterThan(0)) {
      lines.push({
        kind: "rent",
        id: charge.id,
        tenantId,
        label: `Rent — ${formatCalendarDate(charge.periodStart, { month: "long", year: "numeric" })}`,
        propertyName: charge.lease.unit.property.name,
        unitLabel: charge.lease.unit.label,
        dueDate: charge.dueDate,
        amount: charge.amount,
        outstanding,
      });
    }
  }

  for (const split of utilitySplits) {
    const outstanding = computeOutstanding(split.amount, split.payments);
    if (outstanding.greaterThan(0)) {
      lines.push({
        kind: "utility",
        id: split.id,
        tenantId,
        label: `${split.utilityBill.type} — ${formatCalendarDate(split.utilityBill.billDate, { month: "long", year: "numeric" })}`,
        propertyName: split.unit.property.name,
        unitLabel: split.unit.label,
        dueDate: split.utilityBill.dueDate,
        amount: split.amount,
        outstanding,
      });
    }
  }

  lines.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const totalOutstanding = lines.reduce((sum, l) => sum.plus(l.outstanding), new Prisma.Decimal(0));

  return { lines, totalOutstanding };
}

export async function getAllTenantBalances() {
  const tenants = await db.tenant.findMany({ orderBy: { lastName: "asc" } });
  return Promise.all(
    tenants.map(async (tenant) => ({
      tenant,
      ...(await getTenantBalance(tenant.id)),
    }))
  );
}
