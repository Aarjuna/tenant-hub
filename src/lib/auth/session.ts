import "server-only";
import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export interface SessionData {
  isAdmin?: boolean;
  email?: string;
}

export const sessionOptions: SessionOptions = {
  cookieName: "tenant_hub_session",
  password: process.env.SESSION_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireAdminSession() {
  const session = await getSession();
  if (!session.isAdmin) {
    throw new Error("Unauthorized");
  }
  return session;
}
