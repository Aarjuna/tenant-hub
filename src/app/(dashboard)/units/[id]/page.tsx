import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { buttonClass, cardClass, sectionTitleClass } from "@/components/ui";

export default async function UnitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const unit = await db.unit.findUnique({
    where: { id },
    include: {
      property: true,
      leases: { include: { tenant: true }, orderBy: { startDate: "desc" } },
    },
  });

  if (!unit) notFound();

  const activeLease = unit.leases.find((l) => l.status === "ACTIVE");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href={`/properties/${unit.property.id}`} className="text-sm text-zinc-500 hover:text-zinc-900">
          ← {unit.property.name}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{unit.label}</h1>
      </div>

      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <h2 className={sectionTitleClass}>Current lease</h2>
          {!activeLease && (
            <Link href={`/leases/new?unitId=${unit.id}`} className={buttonClass}>
              Add lease
            </Link>
          )}
        </div>
        {activeLease ? (
          <div className="mt-3 text-sm text-zinc-700">
            <p>
              <Link href={`/tenants/${activeLease.tenant.id}`} className="font-medium text-zinc-900 hover:underline">
                {activeLease.tenant.firstName} {activeLease.tenant.lastName}
              </Link>
            </p>
            <p className="mt-1 text-zinc-500">
              ${activeLease.rentAmount.toFixed(2)}/mo · due day {activeLease.dueDay} · started{" "}
              {activeLease.startDate.toLocaleDateString()}
            </p>
            <Link href={`/leases/${activeLease.id}`} className="mt-2 inline-block text-zinc-600 hover:text-zinc-900">
              Edit lease →
            </Link>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">This unit is vacant.</p>
        )}
      </div>

      <div>
        <h2 className={sectionTitleClass}>Lease history</h2>
        <div className="mt-3 flex flex-col gap-3">
          {unit.leases.length === 0 && <p className="text-sm text-zinc-500">No leases yet.</p>}
          {unit.leases.map((lease) => (
            <Link key={lease.id} href={`/leases/${lease.id}`} className={`${cardClass} block hover:border-zinc-400`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900">
                    {lease.tenant.firstName} {lease.tenant.lastName}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {lease.startDate.toLocaleDateString()} –{" "}
                    {lease.endDate ? lease.endDate.toLocaleDateString() : "present"}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-wide text-zinc-400">{lease.status}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
