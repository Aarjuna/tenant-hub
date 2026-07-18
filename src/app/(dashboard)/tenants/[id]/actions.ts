"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getTenantBalance } from "@/lib/balances";
import { sendReminder } from "@/lib/reminders/send";
import { ReminderChannel } from "@/generated/prisma/client";

const tenantSchema = z.object({
  tenantId: z.string().min(1),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});

export async function updateTenant(formData: FormData): Promise<void> {
  await requireAdminSession();

  const parsed = tenantSchema.parse({
    tenantId: formData.get("tenantId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });

  await db.tenant.update({
    where: { id: parsed.tenantId },
    data: {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email ?? null,
      phone: parsed.phone ?? null,
    },
  });

  revalidatePath(`/tenants/${parsed.tenantId}`);
  revalidatePath("/tenants");
  redirect(`/tenants/${parsed.tenantId}?saved=1`);
}

export async function sendManualReminder(formData: FormData): Promise<void> {
  await requireAdminSession();

  const tenantId = String(formData.get("tenantId") ?? "");
  const lineKind = String(formData.get("lineKind") ?? "");
  const lineId = String(formData.get("lineId") ?? "");
  const channel = String(formData.get("channel") ?? "");

  if (!tenantId || !lineId || (lineKind !== "rent" && lineKind !== "utility")) {
    throw new Error("Invalid reminder request");
  }
  if (channel !== ReminderChannel.EMAIL && channel !== ReminderChannel.SMS) {
    throw new Error("Invalid channel");
  }

  const tenant = await db.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  const { lines } = await getTenantBalance(tenantId);
  const line = lines.find((l) => l.kind === lineKind && l.id === lineId);
  if (!line) {
    throw new Error("That balance line no longer exists — it may already be paid.");
  }

  await sendReminder({ tenant, line, channel: channel as ReminderChannel, triggeredBy: "manual" });
  revalidatePath(`/tenants/${tenantId}`);
}

export async function deleteBalanceLine(formData: FormData): Promise<void> {
  await requireAdminSession();

  const tenantId = String(formData.get("tenantId") ?? "");
  const lineKind = String(formData.get("lineKind") ?? "");
  const lineId = String(formData.get("lineId") ?? "");

  if (!tenantId || !lineId || (lineKind !== "rent" && lineKind !== "utility")) {
    throw new Error("Invalid balance line");
  }

  if (lineKind === "rent") {
    // RentCharges for active leases are lazily regenerated for every month up to today, so a
    // hard delete wouldn't stick — it would just reappear on the next balance calculation.
    // Marking it waived keeps the row (and any payments already made against it) but excludes
    // it from outstanding balances, and the generator leaves existing rows alone.
    await db.rentCharge.update({ where: { id: lineId }, data: { waived: true } });
  } else {
    // UtilityBillSplits are only ever created once (when the bill is added), so a hard delete
    // is safe here — nothing will regenerate it. This also cascades away any payments made
    // against it (the UI warns about this before submitting).
    await db.utilityBillSplit.delete({ where: { id: lineId } });
  }

  revalidatePath(`/tenants/${tenantId}`);
  revalidatePath("/");
}

export async function deleteTenant(formData: FormData): Promise<void> {
  await requireAdminSession();

  const tenantId = String(formData.get("tenantId") ?? "");
  if (!tenantId) throw new Error("Missing tenant id");

  // Cascades in the schema also remove this tenant's leases, rent charges,
  // payments, and reminder history. Units/properties/utility bills are untouched.
  await db.tenant.delete({ where: { id: tenantId } });

  revalidatePath("/tenants");
  revalidatePath("/");
  redirect("/tenants");
}
