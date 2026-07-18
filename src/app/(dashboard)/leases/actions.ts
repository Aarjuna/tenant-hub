"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

const createLeaseSchema = z.object({
  unitId: z.string().min(1, "Unit is required"),
  tenantId: z.string().min(1, "Tenant is required"),
  rentAmount: z.coerce.number().positive("Rent must be greater than zero"),
  dueDay: z.coerce.number().int().min(1).max(31),
  startDate: z.coerce.date(),
});

export async function createLease(formData: FormData): Promise<void> {
  await requireAdminSession();

  const parsed = createLeaseSchema.parse({
    unitId: formData.get("unitId"),
    tenantId: formData.get("tenantId"),
    rentAmount: formData.get("rentAmount"),
    dueDay: formData.get("dueDay"),
    startDate: formData.get("startDate"),
  });

  const existingActive = await db.lease.findFirst({
    where: { unitId: parsed.unitId, status: "ACTIVE" },
  });
  if (existingActive) {
    throw new Error("This unit already has an active lease. End it before adding a new one.");
  }

  const lease = await db.lease.create({
    data: { ...parsed, status: "ACTIVE" },
  });

  revalidatePath(`/units/${parsed.unitId}`);
  revalidatePath("/tenants");
  redirect(`/leases/${lease.id}`);
}

const updateLeaseSchema = z.object({
  leaseId: z.string().min(1),
  rentAmount: z.coerce.number().positive("Rent must be greater than zero"),
  dueDay: z.coerce.number().int().min(1).max(31),
});

export async function updateLease(formData: FormData): Promise<void> {
  await requireAdminSession();

  const parsed = updateLeaseSchema.parse({
    leaseId: formData.get("leaseId"),
    rentAmount: formData.get("rentAmount"),
    dueDay: formData.get("dueDay"),
  });

  const lease = await db.lease.update({
    where: { id: parsed.leaseId },
    data: { rentAmount: parsed.rentAmount, dueDay: parsed.dueDay },
  });

  revalidatePath(`/leases/${lease.id}`);
  revalidatePath(`/units/${lease.unitId}`);
}

export async function endLease(formData: FormData): Promise<void> {
  await requireAdminSession();

  const leaseId = String(formData.get("leaseId") ?? "");
  if (!leaseId) throw new Error("Missing lease id");

  const lease = await db.lease.update({
    where: { id: leaseId },
    data: { status: "ENDED", endDate: new Date() },
  });

  revalidatePath(`/leases/${lease.id}`);
  revalidatePath(`/units/${lease.unitId}`);
}
