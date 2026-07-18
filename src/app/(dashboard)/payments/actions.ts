"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getTenantBalance } from "@/lib/balances";

const paymentSchema = z.object({
  tenantId: z.string().min(1),
  target: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  method: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function recordPayment(formData: FormData): Promise<void> {
  await requireAdminSession();

  const parsed = paymentSchema.parse({
    tenantId: formData.get("tenantId"),
    target: formData.get("target"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    notes: formData.get("notes"),
  });

  const [kind, targetId] = parsed.target.split(":");
  if ((kind !== "rent" && kind !== "utility") || !targetId) {
    throw new Error("Invalid payment target");
  }

  // Re-validate the target is still an outstanding line for this tenant before recording.
  const { lines } = await getTenantBalance(parsed.tenantId);
  const line = lines.find((l) => l.kind === kind && l.id === targetId);
  if (!line) {
    throw new Error("That balance line no longer exists — it may already be paid.");
  }

  await db.payment.create({
    data: {
      tenantId: parsed.tenantId,
      rentChargeId: kind === "rent" ? targetId : null,
      utilityBillSplitId: kind === "utility" ? targetId : null,
      amount: parsed.amount,
      method: parsed.method || null,
      notes: parsed.notes || null,
    },
  });

  revalidatePath(`/tenants/${parsed.tenantId}`);
  revalidatePath("/");
  redirect(`/tenants/${parsed.tenantId}`);
}
