import Link from "next/link";
import { db } from "@/lib/db";
import { buttonClass, cardClass, inputClass, labelClass, sectionTitleClass } from "@/components/ui";
import { createTenant } from "./actions";

export default async function TenantsPage() {
  const tenants = await db.tenant.findMany({
    include: {
      leases: { where: { status: "ACTIVE" }, include: { unit: { include: { property: true } } } },
    },
    orderBy: { lastName: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-[#323338]">Tenants</h1>
        <p className="mt-1 text-sm text-zinc-600">Everyone currently or previously renting from you.</p>
      </div>

      <div className="flex flex-col gap-3">
        {tenants.length === 0 && <p className="text-sm text-zinc-600">No tenants yet — add one below.</p>}
        {tenants.map((tenant) => {
          const lease = tenant.leases[0];
          return (
            <Link key={tenant.id} href={`/tenants/${tenant.id}`} className={`${cardClass} block hover:border-zinc-400`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#323338]">
                    {tenant.firstName} {tenant.lastName}
                  </p>
                  <p className="text-sm text-zinc-600">{tenant.email || tenant.phone || "No contact info on file"}</p>
                </div>
                <p className="text-sm text-zinc-600">
                  {lease ? `${lease.unit.property.name} · ${lease.unit.label}` : "No active lease"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className={cardClass}>
        <h2 className={sectionTitleClass}>Add a tenant</h2>
        <form action={createTenant} className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className={labelClass}>
              First name
            </label>
            <input id="firstName" name="firstName" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="lastName" className={labelClass}>
              Last name
            </label>
            <input id="lastName" name="lastName" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input id="email" name="email" type="email" className={inputClass} />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone (E.164, e.g. +15551234567)
            </label>
            <input id="phone" name="phone" className={inputClass} placeholder="+15551234567" />
          </div>
          <button type="submit" className={`${buttonClass} col-span-2 self-start`}>
            Add tenant
          </button>
        </form>
      </div>
    </div>
  );
}
