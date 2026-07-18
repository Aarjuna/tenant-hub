import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getAllTenantBalances } from "@/lib/balances";
import { cardClass, sectionTitleClass } from "@/components/ui";

export default async function DashboardPage() {
  const [balances, recentPayments, recentReminders] = await Promise.all([
    getAllTenantBalances(),
    db.payment.findMany({
      include: { tenant: true },
      orderBy: { paidDate: "desc" },
      take: 5,
    }),
    db.reminderLog.findMany({
      include: { tenant: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalOutstanding = balances.reduce(
    (sum, b) => sum.plus(b.totalOutstanding),
    new Prisma.Decimal(0)
  );
  const withBalance = balances
    .filter((b) => b.totalOutstanding.greaterThan(0))
    .sort((a, b) => b.totalOutstanding.comparedTo(a.totalOutstanding));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">Everything outstanding across your properties.</p>
      </div>

      <div className={cardClass}>
        <p className="text-sm text-zinc-600">Total outstanding</p>
        <p className="mt-1 text-3xl font-semibold text-zinc-900">${totalOutstanding.toFixed(2)}</p>
      </div>

      <div>
        <h2 className={sectionTitleClass}>Tenants with a balance</h2>
        <div className="mt-3 flex flex-col gap-3">
          {withBalance.length === 0 && (
            <p className="text-sm text-zinc-600">Nobody owes anything right now.</p>
          )}
          {withBalance.map(({ tenant, totalOutstanding, lines }) => (
            <Link key={tenant.id} href={`/tenants/${tenant.id}`} className={`${cardClass} block hover:border-zinc-400`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900">
                    {tenant.firstName} {tenant.lastName}
                  </p>
                  <p className="text-sm text-zinc-600">
                    {lines.length} outstanding item{lines.length === 1 ? "" : "s"}
                  </p>
                </div>
                <p className="font-medium text-zinc-900">${totalOutstanding.toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className={sectionTitleClass}>Recent payments</h2>
          <div className="mt-3 flex flex-col gap-2">
            {recentPayments.length === 0 && <p className="text-sm text-zinc-600">No payments recorded yet.</p>}
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between rounded-md border border-zinc-200 px-4 py-2 text-sm">
                <span className="text-zinc-700">
                  {payment.tenant.firstName} {payment.tenant.lastName} · {payment.paidDate.toLocaleDateString()}
                </span>
                <span className="font-medium text-zinc-900">${payment.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className={sectionTitleClass}>Recent reminders</h2>
          <div className="mt-3 flex flex-col gap-2">
            {recentReminders.length === 0 && <p className="text-sm text-zinc-600">No reminders sent yet.</p>}
            {recentReminders.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-md border border-zinc-200 px-4 py-2 text-sm">
                <span className="text-zinc-700">
                  {log.tenant.firstName} {log.tenant.lastName} · {log.channel}
                </span>
                <span className={log.status === "SENT" ? "text-green-600" : "text-red-600"}>{log.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
