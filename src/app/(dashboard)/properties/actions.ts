"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

const propertySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  address: z.string().trim().min(1, "Address is required"),
});

export async function createProperty(formData: FormData): Promise<void> {
  await requireAdminSession();

  const parsed = propertySchema.parse({
    name: formData.get("name"),
    address: formData.get("address"),
  });

  await db.property.create({ data: parsed });
  revalidatePath("/properties");
}
