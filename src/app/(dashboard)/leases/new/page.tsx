import Link from "next/link";
import { db } from "@/lib/db";
import { buttonClass, cardClass, inputClass, labelClass, selectClass } from "@/components/ui";
import { createLease } from "../actions";

export default async function NewLeasePage({
  searchParams,
}: {
  searchParams: Promise<{ unitId?: string }>;
}) {
  const { unitId } = await searchParams;

  const [units, tenants] = await Promise.all([
    db.unit.findMany({ include: { property: true }, orderBy: [{ property: { name: "asc" } }, { label: "asc" }] }),
    db.tenant.findMany({ orderBy: { lastName: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/properties" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Properties
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Add lease</h1>
      </div>

      {tenants.length === 0 ? (
        <p className="text-sm text-zinc-600">
          You need a tenant first.{" "}
          <Link href="/tenants" className="underline">
            Add one
          </Link>
          .
        </p>
      ) : (
        <div className={cardClass}>
          <form action={createLease} className="flex flex-col gap-4">
            <div>
              <label htmlFor="unitId" className={labelClass}>
                Unit
              </label>
              <select id="unitId" name="unitId" required defaultValue={unitId ?? ""} className={selectClass}>
                <option value="" disabled>
                  Select a unit
                </option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.property.name} — {unit.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="rentAmount" className={labelClass}>
                  Monthly rent ($)
                </label>
                <input
                  id="rentAmount"
                  name="rentAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="dueDay" className={labelClass}>
                  Due day of month
                </label>
                <input
                  id="dueDay"
                  name="dueDay"
                  type="number"
                  min="1"
                  max="31"
                  defaultValue={1}
                  required
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="startDate" className={labelClass}>
                Start date
              </label>
              <input id="startDate" name="startDate" type="date" required className={inputClass} />
            </div>
            <button type="submit" className={`${buttonClass} self-start`}>
              Create lease
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
