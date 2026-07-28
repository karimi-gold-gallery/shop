import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { createSession, getPostAuthRedirectPath, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { absoluteUrl } from "@/lib/request-origin";
import { loginSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const formData = await request.formData();
  const loginUrl = absoluteUrl(request, "/login");

  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    loginUrl.searchParams.set("error", parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است");
    const username = formData.get("username");
    if (typeof username === "string" && username) {
      loginUrl.searchParams.set("username", username);
    }
    return NextResponse.redirect(loginUrl, 303);
  }

  loginUrl.searchParams.set("username", parsed.data.username);

  const user = await db.query.users.findFirst({
    where: eq(users.username, parsed.data.username),
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    loginUrl.searchParams.set("error", "نام کاربری یا رمز عبور اشتباه است");
    return NextResponse.redirect(loginUrl, 303);
  }

  await createSession(user.id);
  revalidatePath("/", "layout");

  return NextResponse.redirect(absoluteUrl(request, getPostAuthRedirectPath(user)), 303);
}
