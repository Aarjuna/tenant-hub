import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBalance } from "@/lib/balances";
import { formatCalendarDate } from "@/lib/formatDate";
import {
  buttonClass,
  cardClass,
  dangerButtonClass,
  inputClass,
  labelClass,
  leaseStatusTone,
  pillClass,
  reminderStatusTone,
  secondaryButtonClass,
  sectionTitleClass,
} from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { deleteTenant, sendManualReminder, updateTenant } from "./actions";

export default async function TenantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

  const tenant = await db.tenant.findUnique({
    where: { id },
    include: {
      leases: { include: { unit: { include: { property: true } } }, orderBy: { startDate: "desc" } },
      payments: { orderBy: { paidDate: "desc" }, take: 20 },
      reminderLogs: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!tenant) notFound();

  const { lines, totalOutstanding } = await getTenantBalance(id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/tenants" className="text-sm text-zinc-600 hover:text-[#323338]">
            ← Tenants
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-[#323338]">
            {tenant.firstName} {tenant.lastName}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {tenant.email || "No email"} · {tenant.phone || "No phone"}
          </p>
        </div>
        <Link href={`/payments/new?tenantId=${tenant.id}`} className={buttonClass}>
          Record payment
        </Link>
      </div>

      <div className={cardClass}>
        <h2 className={sectionTitleClass}>Edit details</h2>
        {saved === "1" && (
          <p className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Saved.</p>
        )}
        <form action={updateTenant} className="mt-4 grid grid-cols-2 gap-4">
          <input type="hidden" name="tenantId" value={tenant.id} />
          <div>
            <label htmlFor="firstName" className={labelClass}>
              First name
            </label>
            <input id="firstName" name="firstName" required defaultValue={tenant.firstName} className={inputClass} />
          </div>
          <div>
            <label htmlFor="lastName" className={labelClass}>
              Last name
            </label>
            <input id="lastName" name="lastName" required defaultValue={tenant.lastName} className={inputClass} />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={tenant.email ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone (E.164, e.g. +15551234567)
            </label>
            <input id="phone" name="phone" defaultValue={tenant.phone ?? ""} className={inputClass} />
          </div>
          <button type="submit" className={`${buttonClass} col-span-2 self-start`}>
            Save changes
          </button>
        </form>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className={sectionTitleClass}>Outstanding balance</h2>
          <p className={`text-lg font-bold ${totalOutstanding.greaterThan(0) ? "text-[#e2445c]" : "text-[#00c875]"}`}>
            ${totalOutstanding.toFixed(2)}
          </p>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {lines.length === 0 && <p className="text-sm text-zinc-600">Nothing outstanding — all caught up.</p>}
          {lines.map((line) => (
            <div key={`${line.kind}-${line.id}`} className={cardClass}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#323338]">{line.label}</p>
                  <p className="text-sm text-zinc-600">
                    {line.propertyName} {line.unitLabel} · due {formatCalendarDate(line.dueDate)}
                  </p>
                </div>
                <p className="font-bold text-[#e2445c]">${line.outstanding.toFixed(2)}</p>
              </div>
              <div className="mt-3 flex gap-2">
                {tenant.email && (
                  <form action={sendManualReminder}>
                    <input type="hidden" name="tenantId" value={tenant.id} />
                    <input type="hidden" name="lineKind" value={line.kind} />
                    <input type="hidden" name="lineId" value={line.id} />
                    <input type="hidden" name="channel" value="EMAIL" />
                    <button type="submit" className={secondaryButtonClass}>
                      Email reminder
                    </button>
                  </form>
                )}
                {tenant.phone && (
                  <form action={sendManualReminder}>
                    <input type="hidden" name="tenantId" value={tenant.id} />
                    <input type="hidden" name="lineKind" value={line.kind} />
                    <input type="hidden" name="lineId" value={line.id} />
                    <input type="hidden" name="channel" value="SMS" />
                    <button type="submit" className={secondaryButtonClass}>
                      Text reminder
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className={sectionTitleClass}>Leases</h2>
        <div className="mt-3 flex flex-col gap-3">
          {tenant.leases.map((lease) => (
            <Link key={lease.id} href={`/leases/${lease.id}`} className={`${cardClass} block hover:border-zinc-400`}>
              <div className="flex items-center justify-between">
                <p className="text-[#323338]">
                  {lease.unit.property.name} — {lease.unit.label}
                </p>
                <span className={pillClass(leaseStatusTone(lease.status))}>{lease.status}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className={sectionTitleClass}>Payment history</h2>
        <div className="mt-3 flex flex-col gap-2">
          {tenant.payments.length === 0 && <p className="text-sm text-zinc-600">No payments recorded yet.</p>}
          {tenant.payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between rounded-md border border-zinc-200 px-4 py-2 text-sm">
              <span className="text-zinc-700">
                {payment.paidDate.toLocaleDateString()} {payment.method ? `· ${payment.method}` : ""}
              </span>
              <span className="font-medium text-[#323338]">${payment.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className={sectionTitleClass}>Reminder history</h2>
        <div className="mt-3 flex flex-col gap-2">
          {tenant.reminderLogs.length === 0 && <p className="text-sm text-zinc-600">No reminders sent yet.</p>}
          {tenant.reminderLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between rounded-md border border-zinc-200 px-4 py-2 text-sm">
              <span className="text-zinc-700">
                {log.createdAt.toLocaleString()} · {log.type.replaceAll("_", " ").toLowerCase()} · {log.channel} ·{" "}
                {log.triggeredBy}
              </span>
              <span className={pillClass(reminderStatusTone(log.status))}>{log.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-zinc-200 pt-6">
        <form action={deleteTenant}>
          <input type="hidden" name="tenantId" value={tenant.id} />
          <ConfirmSubmitButton
            className={dangerButtonClass}
            confirmMessage={`Delete ${tenant.firstName} ${tenant.lastName}? This permanently deletes their leases, rent charges, payment history, and reminder history. This cannot be undone.`}
          >
            Delete tenant
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}
