import type { BalanceLine } from "@/lib/balances";
import { formatCalendarDate } from "@/lib/formatDate";

export function renderReminderMessage(params: {
  tenantFirstName: string;
  line: BalanceLine;
  isOverdue: boolean;
}): string {
  const { tenantFirstName, line, isOverdue } = params;
  const amount = line.outstanding.toFixed(2);
  const due = formatCalendarDate(line.dueDate, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const kindLabel = line.kind === "rent" ? "rent" : "utility bill share";
  const place = `${line.propertyName} ${line.unitLabel}`;

  if (isOverdue) {
    return `Hi ${tenantFirstName}, this is a reminder that your ${kindLabel} payment of $${amount} for ${place} was due ${due} and is now overdue. Please arrange payment as soon as possible.`;
  }
  return `Hi ${tenantFirstName}, a friendly reminder that your ${kindLabel} payment of $${amount} for ${place} is due ${due}.`;
}
