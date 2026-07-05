"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  createSession,
  getCurrentUser,
  hashPassword,
  signOut,
  verifyPassword,
} from "@/lib/auth";
import {
  loginSchema,
  registerSchema,
  onboardingSchema,
  profileSchema,
} from "@/lib/schemas";

export type AuthState = { error?: string } | undefined;

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است" };
  }

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });
  if (!user) return { error: "نام کاربری یا رمز عبور اشتباه است" };

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return { error: "نام کاربری یا رمز عبور اشتباه است" };

  await createSession(user.id);
  revalidatePath("/", "layout");

  if (user.role === "ADMIN") redirect("/admin");
  if (!user.onboarded) redirect("/onboarding");
  redirect("/");
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است" };
  }

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });
  if (existing) return { error: "این نام کاربری قبلاً ثبت شده است" };

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: { username: parsed.data.username, passwordHash, role: "CUSTOMER" },
  });

  await createSession(user.id);
  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function onboardingAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const user = await getCurrentUser();
  if (!user) return { error: "ابتدا وارد شوید" };

  const parsed = onboardingSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    birthDate: formData.get("birthDate"),
    gender: formData.get("gender"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      birthDate: parsed.data.birthDate,
      gender: parsed.data.gender,
      phone: parsed.data.phone,
      onboarded: true,
    },
  });

  revalidatePath("/", "layout");
  redirect("/");
}

export async function updateProfileAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const user = await getCurrentUser();
  if (!user) return { error: "ابتدا وارد شوید" };

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    birthDate: formData.get("birthDate"),
    gender: formData.get("gender"),
    phone: formData.get("phone"),
    nationalCode: formData.get("nationalCode"),
    city: formData.get("city"),
    address: formData.get("address"),
    postalCode: formData.get("postalCode"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      birthDate: parsed.data.birthDate,
      gender: parsed.data.gender,
      phone: parsed.data.phone,
      nationalCode: parsed.data.nationalCode || null,
      city: parsed.data.city || null,
      address: parsed.data.address || null,
      postalCode: parsed.data.postalCode || null,
      onboarded: true,
    },
  });

  revalidatePath("/", "layout");
  return { error: undefined };
}

export async function logoutAction() {
  await signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
