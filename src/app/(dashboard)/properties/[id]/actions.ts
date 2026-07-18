"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
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
