import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const session = await getSession();
  session.destroy();
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
