import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { sessions, type User } from "@/lib/db/schema";

export const SESSION_COOKIE = "karimi_session";
const SESSION_TTL_DAYS = 30;

export type SafeUser = Omit<User, "passwordHash">;

function sanitize(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ token, userId, expiresAt });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.token, token),
    with: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db
      .delete(sessions)
      .where(eq(sessions.id, session.id))
      .catch(() => {});
    const s = await cookies();
    s.delete(SESSION_COOKIE);
    return null;
  }
  return sanitize(session.user);
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db
      .delete(sessions)
      .where(eq(sessions.token, token))
      .catch(() => {});
  }
  store.delete(SESSION_COOKIE);
}

export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SafeUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

export async function requireOnboardedUser(): Promise<SafeUser> {
  const user = await requireUser();
  if (!user.onboarded) redirect("/onboarding");
  return user;
}

export function getPostAuthRedirectPath(user: SafeUser): string {
  if (user.role === "ADMIN") return "/admin";
  if (!user.onboarded) return "/onboarding";
  return "/";
}

export async function redirectIfAuthenticated(): Promise<void> {
  const user = await getCurrentUser();
  if (user) redirect(getPostAuthRedirectPath(user));
}

export async function requireIncompleteOnboarding(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.onboarded) redirect(getPostAuthRedirectPath(user));
  return user;
}
