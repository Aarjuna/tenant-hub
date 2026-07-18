import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  const valid =
    !!adminEmail &&
    !!adminPasswordHash &&
    email === adminEmail &&
    (await bcrypt.compare(password, adminPasswordHash));

  if (!valid) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "1");
    return NextResponse.redirect(url, { status: 303 });
  }

  const session = await getSession();
  session.isAdmin = true;
  session.email = adminEmail;
  await session.save();

  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
