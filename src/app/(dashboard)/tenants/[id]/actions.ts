"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getTenantBalance } from "@/lib/balances";
import { sendReminder } from "@/lib/reminders/send";
import { ReminderChannel } from "@/generated/prisma/client";

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
