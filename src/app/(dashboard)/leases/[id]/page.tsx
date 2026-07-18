import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  buttonClass,
  cardClass,
  inputClass,
  labelClass,
  leaseStatusTone,
  pillClass,
  secondaryButtonClass,
  sectionTitleClass,
} from "@/components/ui";
import { endLease, updateLease } from "../actions";

export default async function LeaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const lease = await db.lease.findUnique({
    where: { id },
    include: { unit: { include: { property: true } }, tenant: true },
  });

  if (!lease) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/units/${lease.unit.id}`} className="text-sm text-zinc-600 hover:text-[#323338]">
          ← {lease.unit.property.name} — {lease.unit.label}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-[#323338]">
          Lease — {lease.tenant.firstName} {lease.tenant.lastName}
        </h1>
        <span className={`mt-2 ${pillClass(leaseStatusTone(lease.status))}`}>{lease.status}</span>
      </div>

      <div className={cardClass}>
        <h2 className={sectionTitleClass}>Terms</h2>
        <form action={updateLease} className="mt-4 flex flex-col gap-4">
          <input type="hidden" name="leaseId" value={lease.id} />
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
                defaultValue={lease.rentAmount.toString()}
                className={inputClass}
                disabled={lease.status !== "ACTIVE"}
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
                required
                defaultValue={lease.dueDay}
                className={inputClass}
                disabled={lease.status !== "ACTIVE"}
              />
            </div>
          </div>
          <p className="text-sm text-zinc-600">
            Started {lease.startDate.toLocaleDateString()}
            {lease.endDate ? ` · Ended ${lease.endDate.toLocaleDateString()}` : ""}
          </p>
          {lease.status === "ACTIVE" && (
            <button type="submit" className={`${buttonClass} self-start`}>
              Save changes
            </button>
          )}
        </form>
      </div>

      {lease.status === "ACTIVE" && (
        <form action={endLease}>
          <input type="hidden" name="leaseId" value={lease.id} />
          <button type="submit" className={secondaryButtonClass}>
            End lease
          </button>
        </form>
      )}
    </div>
  );
}
