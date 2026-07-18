"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { splitByFixedAmount, splitByPercentage, splitEqual } from "@/lib/utilitySplit";

const billSchema = z.object({
  propertyId: z.string().min(1),
  type: z.string().trim().min(1),
  totalAmount: z.coerce.number().positive(),
  billDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  splitMethod: z.enum(["EQUAL", "PERCENTAGE", "FIXED_AMOUNT"]),
});

export async function createUtilityBill(formData: FormData): Promise<void> {
  await requireAdminSession();

  const parsed = billSchema.parse({
    propertyId: formData.get("propertyId"),
    type: formData.get("type"),
    totalAmount: formData.get("totalAmount"),
    billDate: formData.get("billDate"),
    dueDate: formData.get("dueDate"),
    splitMethod: formData.get("splitMethod"),
  });

  const units = await db.unit.findMany({ where: { propertyId: parsed.propertyId } });
  if (units.length === 0) {
    throw new Error("This property has no units to split a bill across");
  }

  const splits =
    parsed.splitMethod === "EQUAL"
      ? splitEqual(parsed.totalAmount, units.map((u) => u.id))
      : parsed.splitMethod === "PERCENTAGE"
        ? splitByPercentage(
            parsed.totalAmount,
            units.map((u) => ({ unitId: u.id, percentage: Number(formData.get(`unit_${u.id}`)) || 0 }))
          )
        : splitByFixedAmount(
            parsed.totalAmount,
            units.map((u) => ({ unitId: u.id, amount: Number(formData.get(`unit_${u.id}`)) || 0 }))
          );

  const bill = await db.utilityBill.create({
    data: {
      propertyId: parsed.propertyId,
      type: parsed.type,
      totalAmount: parsed.totalAmount,
      billDate: parsed.billDate,
      dueDate: parsed.dueDate,
      splitMethod: parsed.splitMethod,
      splits: {
        create: splits.map((s) => ({
          unitId: s.unitId,
          amount: s.amount,
          percentage: s.percentage ?? null,
        })),
      },
    },
  });

  revalidatePath(`/properties/${parsed.propertyId}`);
  redirect(`/utility-bills/${bill.id}`);
}
