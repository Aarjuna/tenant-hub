import Link from "next/link";
import { db } from "@/lib/db";
import { cardClass } from "@/components/ui";
import { UtilityBillForm } from "@/components/UtilityBillForm";
import { createUtilityBill } from "../actions";

export default async function NewUtilityBillPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string }>;
}) {
  const { propertyId } = await searchParams;

  const properties = await db.property.findMany({
    include: { units: { orderBy: { label: "asc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/properties" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Properties
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Add utility bill</h1>
      </div>

      {properties.length === 0 ? (
        <p className="text-sm text-zinc-500">
          You need a property with units first.{" "}
          <Link href="/properties" className="underline">
            Add one
          </Link>
          .
        </p>
      ) : (
        <div className={cardClass}>
          <UtilityBillForm properties={properties} action={createUtilityBill} defaultPropertyId={propertyId} />
        </div>
      )}
    </div>
  );
}
