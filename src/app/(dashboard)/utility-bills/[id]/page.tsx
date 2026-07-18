import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { computeOutstanding } from "@/lib/balances";
import { formatCalendarDate } from "@/lib/formatDate";
import { cardClass, pillClass, sectionTitleClass } from "@/components/ui";

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
        <Link href={`/properties/${bill.property.id}`} className="text-sm text-zinc-600 hover:text-[#323338]">
          ← {bill.property.name}
        </Link>
        <h1 className="mt-1 text-2xl font-bold capitalize text-[#323338]">{bill.type} bill</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Billed {formatCalendarDate(bill.billDate)} · Due {formatCalendarDate(bill.dueDate)} · Total $
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
              <div
                key={split.id}
                className={`${cardClass} border-l-4 ${outstanding.greaterThan(0) ? "border-l-[#fdab3d]" : "border-l-[#00c875]"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#323338]">{split.unit.label}</p>
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
                    <p className="font-medium text-[#323338]">${split.amount.toFixed(2)}</p>
                    <span className={`mt-1 inline-block ${pillClass(outstanding.greaterThan(0) ? "orange" : "green")}`}>
                      {outstanding.greaterThan(0) ? `$${outstanding.toFixed(2)} owed` : "Paid"}
                    </span>
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
