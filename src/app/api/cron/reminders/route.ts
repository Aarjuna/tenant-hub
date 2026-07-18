import { NextRequest, NextResponse } from "next/server";
import { runReminderSweep } from "@/lib/reminders/sweep";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runReminderSweep();
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  return GET(request);
}
