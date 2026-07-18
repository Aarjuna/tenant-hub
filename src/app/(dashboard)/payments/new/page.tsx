import Link from "next/link";
import { db } from "@/lib/db";
import { getTenantBalance } from "@/lib/balances";
import { buttonClass, cardClass, inputClass, labelClass, selectClass } from "@/components/ui";
import { recordPayment } from "../actions";

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  const { tenantId } = await searchParams;

  if (!tenantId) {
    const tenants = await db.tenant.findMany({ orderBy: { lastName: "asc" } });
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Record payment</h1>
        <div className={cardClass}>
          <form action="/payments/new" className="flex items-end gap-3">
            <div className="flex-1">
              <label htmlFor="tenantId" className={labelClass}>
                Tenant
              </label>
              <select id="tenantId" name="tenantId" required defaultValue="" className={selectClass}>
                <option value="" disabled>
                  Select a tenant
                </option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.firstName} {tenant.lastName}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className={buttonClass}>
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return <p className="text-sm text-red-600">Tenant not found.</p>;
  }

  const { lines } = await getTenantBalance(tenantId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/tenants/${tenant.id}`} className="text-sm text-zinc-500 hover:text-zinc-900">
          ← {tenant.firstName} {tenant.lastName}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Record payment</h1>
      </div>

      {lines.length === 0 ? (
        <p className="text-sm text-zinc-500">This tenant has no outstanding balance.</p>
      ) : (
        <div className={cardClass}>
          <form action={recordPayment} className="flex flex-col gap-4">
            <input type="hidden" name="tenantId" value={tenant.id} />
            <div>
              <label htmlFor="target" className={labelClass}>
                Applies to
              </label>
              <select id="target" name="target" required defaultValue={`${lines[0].kind}:${lines[0].id}`} className={selectClass}>
                {lines.map((line) => (
                  <option key={`${line.kind}-${line.id}`} value={`${line.kind}:${line.id}`}>
                    {line.label} — ${line.outstanding.toFixed(2)} owed (due {line.dueDate.toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className={labelClass}>
                  Amount ($)
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  defaultValue={lines[0].outstanding.toFixed(2)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="method" className={labelClass}>
                  Method
                </label>
                <input id="method" name="method" className={inputClass} placeholder="cash, check, Zelle…" />
              </div>
            </div>
            <div>
              <label htmlFor="notes" className={labelClass}>
                Notes (optional)
              </label>
              <input id="notes" name="notes" className={inputClass} />
            </div>
            <button type="submit" className={`${buttonClass} self-start`}>
              Record payment
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
