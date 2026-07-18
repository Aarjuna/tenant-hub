"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

const unitSchema = z.object({
  propertyId: z.string().min(1),
  label: z.string().trim().min(1, "Unit label is required"),
});

export async function createUnit(formData: FormData): Promise<void> {
  await requireAdminSession();

  const parsed = unitSchema.parse({
    propertyId: formData.get("propertyId"),
    label: formData.get("label"),
  });

  await db.unit.create({ data: parsed });
  revalidatePath(`/properties/${parsed.propertyId}`);
}

export async function deleteProperty(formData: FormData): Promise<void> {
  await requireAdminSession();

  const propertyId = String(formData.get("propertyId") ?? "");
  if (!propertyId) throw new Error("Missing property id");

  // Cascades in the schema also remove this property's units, leases, rent
  // charges, utility bills/splits, and the payments tied to them.
  await db.property.delete({ where: { id: propertyId } });

  revalidatePath("/properties");
  revalidatePath("/");
  redirect("/properties");
}
