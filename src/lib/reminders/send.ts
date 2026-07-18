import { Resend } from "resend";
import twilio from "twilio";
import { db } from "@/lib/db";
import { ReminderType, ReminderChannel } from "@/generated/prisma/client";
import type { BalanceLine } from "@/lib/balances";
import { renderReminderMessage } from "@/lib/reminders/templates";

function reminderTypeFor(line: BalanceLine, isOverdue: boolean): ReminderType {
  if (line.kind === "rent") {
    return isOverdue ? ReminderType.RENT_OVERDUE : ReminderType.RENT_DUE_SOON;
  }
  return isOverdue ? ReminderType.UTILITY_OVERDUE : ReminderType.UTILITY_DUE_SOON;
}

let resendClient: Resend | null = null;
function getResend(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

let twilioClient: ReturnType<typeof twilio> | null = null;
function getTwilioClient(): ReturnType<typeof twilio> {
  if (!twilioClient) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error("Twilio credentials are not configured");
    }
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

export interface ReminderTenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

export interface SendReminderParams {
  tenant: ReminderTenant;
  line: BalanceLine;
  channel: ReminderChannel;
  triggeredBy: "cron" | "manual";
}

/** Renders, dispatches, and logs a single reminder. The one send path used by both the cron sweep and manual sends. */
export async function sendReminder({ tenant, line, channel, triggeredBy }: SendReminderParams) {
  const isOverdue = line.dueDate.getTime() < Date.now();
  const type = reminderTypeFor(line, isOverdue);
  const message = renderReminderMessage({ tenantFirstName: tenant.firstName, line, isOverdue });

  const logBase = {
    tenantId: tenant.id,
    type,
    channel,
    triggeredBy,
    message,
    rentChargeId: line.kind === "rent" ? line.id : null,
    utilityBillSplitId: line.kind === "utility" ? line.id : null,
  };

  try {
    if (channel === ReminderChannel.EMAIL) {
      if (!tenant.email) throw new Error(`${tenant.firstName} ${tenant.lastName} has no email on file`);
      if (!process.env.RESEND_FROM_EMAIL) throw new Error("RESEND_FROM_EMAIL is not configured");
      await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: tenant.email,
        subject: isOverdue ? "Overdue payment reminder" : "Upcoming payment reminder",
        text: message,
      });
    } else {
      if (!tenant.phone) throw new Error(`${tenant.firstName} ${tenant.lastName} has no phone on file`);
      if (!process.env.TWILIO_FROM_NUMBER) throw new Error("TWILIO_FROM_NUMBER is not configured");
      await getTwilioClient().messages.create({
        from: process.env.TWILIO_FROM_NUMBER,
        to: tenant.phone,
        body: message,
      });
    }

    return db.reminderLog.create({ data: { ...logBase, status: "SENT" } });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return db.reminderLog.create({ data: { ...logBase, status: "FAILED", errorMessage } });
  }
}
