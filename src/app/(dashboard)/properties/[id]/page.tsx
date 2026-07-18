import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { buttonClass, cardClass, dangerButtonClass, inputClass, labelClass, sectionTitleClass } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { createUnit, deleteProperty } from "./actions";

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const property = await db.property.findUnique({
    where: { id },
    include: {
      units: { include: { leases: { where: { status: "ACTIVE" }, include: { tenant: true } } } },
      utilityBills: { orderBy: { billDate: "desc" }, take: 10 },
    },
  });

  if (!property) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/properties" className="text-sm text-zinc-600 hover:text-[#323338]">
          ← Properties
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-[#323338]">{property.name}</h1>
        <p className="mt-1 text-sm text-zinc-600">{property.address}</p>
      </div>

      <div>
        <h2 className={sectionTitleClass}>Units</h2>
        <div className="mt-3 flex flex-col gap-3">
          {property.units.length === 0 && <p className="text-sm text-zinc-600">No units yet.</p>}
          {property.units.map((unit) => {
            const lease = unit.leases[0];
            return (
              <Link key={unit.id} href={`/units/${unit.id}`} className={`${cardClass} block hover:border-zinc-400`}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-[#323338]">{unit.label}</p>
                  <p className="text-sm text-zinc-600">
                    {lease ? `${lease.tenant.firstName} ${lease.tenant.lastName} · $${lease.rentAmount}/mo` : "Vacant"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className={cardClass}>
        <h2 className={sectionTitleClass}>Add a unit</h2>
        <form action={createUnit} className="mt-4 flex items-end gap-3">
          <input type="hidden" name="propertyId" value={property.id} />
          <div className="flex-1">
            <label htmlFor="label" className={labelClass}>
              Unit label
            </label>
            <input id="label" name="label" required className={inputClass} placeholder="Unit A" />
          </div>
          <button type="submit" className={buttonClass}>
            Add unit
          </button>
        </form>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className={sectionTitleClass}>Utility bills</h2>
          <Link href={`/utility-bills/new?propertyId=${property.id}`} className="text-sm text-zinc-600 hover:text-[#323338]">
            + Add utility bill
          </Link>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {property.utilityBills.length === 0 && (
            <p className="text-sm text-zinc-600">No utility bills recorded yet.</p>
          )}
          {property.utilityBills.map((bill) => (
            <Link key={bill.id} href={`/utility-bills/${bill.id}`} className={`${cardClass} block hover:border-zinc-400`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize text-[#323338]">{bill.type}</p>
                  <p className="text-sm text-zinc-600">
                    Billed {bill.billDate.toLocaleDateString()} · Due {bill.dueDate.toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm text-zinc-600">${bill.totalAmount.toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-zinc-200 pt-6">
        <form action={deleteProperty}>
          <input type="hidden" name="propertyId" value={property.id} />
          <ConfirmSubmitButton
            className={dangerButtonClass}
            confirmMessage={`Delete "${property.name}"? This permanently deletes all its units, leases, rent charges, utility bills, and payment history. This cannot be undone.`}
          >
            Delete property
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}
