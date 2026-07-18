import { addDays, isAfter, isBefore, startOfDay, subDays } from "date-fns";
import { UTCDate } from "@date-fns/utc";
import { db } from "@/lib/db";
import { ReminderChannel, ReminderType } from "@/generated/prisma/client";
import { getAllTenantBalances, type BalanceLine } from "@/lib/balances";
import { sendReminder } from "@/lib/reminders/send";

export const DUE_SOON_WINDOW_DAYS = 3;
export const REMINDER_COOLDOWN_DAYS = 3;

export type DueDateClassification = "overdue" | "due_soon" | "not_due";

/** Pure eligibility check: is a charge/split due soon or overdue, relative to `today`? Both dates are compared as UTC calendar days. */
export function classifyDueDate(
  dueDate: Date,
  today: Date = new Date(),
  dueSoonWindowDays: number = DUE_SOON_WINDOW_DAYS
): DueDateClassification {
  const todayStart = startOfDay(new UTCDate(today));
  const dueStart = startOfDay(new UTCDate(dueDate));
  const dueSoonCutoff = addDays(todayStart, dueSoonWindowDays);

  if (isBefore(dueStart, todayStart)) return "overdue";
  if (!isAfter(dueStart, dueSoonCutoff)) return "due_soon";
  return "not_due";
}

export function reminderTypeFor(line: Pick<BalanceLine, "kind">, isOverdue: boolean): ReminderType {
  if (line.kind === "rent") {
    return isOverdue ? ReminderType.RENT_OVERDUE : ReminderType.RENT_DUE_SOON;
  }
  return isOverdue ? ReminderType.UTILITY_OVERDUE : ReminderType.UTILITY_DUE_SOON;
}

async function wasRecentlyReminded(
  tenantId: string,
  line: BalanceLine,
  type: ReminderType,
  channel: ReminderChannel
): Promise<boolean> {
  const since = subDays(new Date(), REMINDER_COOLDOWN_DAYS);
  const existing = await db.reminderLog.findFirst({
    where: {
      tenantId,
      type,
      channel,
      status: "SENT",
      createdAt: { gte: since },
      ...(line.kind === "rent" ? { rentChargeId: line.id } : { utilityBillSplitId: line.id }),
    },
  });
  return existing !== null;
}

export interface SweepResult {
  sent: number;
  failed: number;
  skipped: number;
}

/** Automatic reminder sweep: finds due-soon/overdue balances and sends reminders, respecting a per-item cooldown. */
export async function runReminderSweep(): Promise<SweepResult> {
  const balances = await getAllTenantBalances();
  const today = new Date();

  const result: SweepResult = { sent: 0, failed: 0, skipped: 0 };

  for (const { tenant, lines } of balances) {
    for (const line of lines) {
      const classification = classifyDueDate(line.dueDate, today);
      if (classification === "not_due") continue;
      const isOverdue = classification === "overdue";

      const type = reminderTypeFor(line, isOverdue);
      const channels: ReminderChannel[] = [];
      if (tenant.email) channels.push(ReminderChannel.EMAIL);
      if (tenant.phone) channels.push(ReminderChannel.SMS);

      for (const channel of channels) {
        if (await wasRecentlyReminded(tenant.id, line, type, channel)) {
          result.skipped++;
          continue;
        }
        const log = await sendReminder({ tenant, line, channel, triggeredBy: "cron" });
        if (log.status === "SENT") result.sent++;
        else result.failed++;
      }
    }
  }

  return result;
}
