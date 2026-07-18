import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { computeOutstanding } from "@/lib/balances";
import { cardClass, sectionTitleClass } from "@/components/ui";

export default async function UtilityBillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const bill = await db.utilityBill.findUnique({
    where: { id },
    include: {
      property: true,
      splits: {
        include: {
          unit: { include: { leases: { where: { status: "ACTIVE" }, include: { tenant: true } } } },
          payments: true,
        },
      },
    },
  });

  if (!bill) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/properties/${bill.property.id}`} className="text-sm text-zinc-600 hover:text-zinc-900">
          ← {bill.property.name}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold capitalize text-zinc-900">{bill.type} bill</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Billed {bill.billDate.toLocaleDateString()} · Due {bill.dueDate.toLocaleDateString()} · Total $
          {bill.totalAmount.toFixed(2)} · Split {bill.splitMethod.toLowerCase().replace("_", " ")}
        </p>
      </div>

      <div>
        <h2 className={sectionTitleClass}>Per-unit split</h2>
        <div className="mt-3 flex flex-col gap-3">
          {bill.splits.map((split) => {
            const outstanding = computeOutstanding(split.amount, split.payments);
            const tenant = split.unit.leases[0]?.tenant;
            return (
              <div key={split.id} className={cardClass}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-900">{split.unit.label}</p>
                    <p className="text-sm text-zinc-600">
                      {tenant ? (
                        <Link href={`/tenants/${tenant.id}`} className="hover:underline">
                          {tenant.firstName} {tenant.lastName}
                        </Link>
                      ) : (
                        "Vacant"
                      )}
                      {split.percentage != null && ` · ${split.percentage.toFixed(1)}%`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-zinc-900">${split.amount.toFixed(2)}</p>
                    <p className={`text-sm ${outstanding.greaterThan(0) ? "text-red-600" : "text-green-600"}`}>
                      {outstanding.greaterThan(0) ? `$${outstanding.toFixed(2)} owed` : "Paid"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
