import { z } from "zod";

import { toEnglishDigits } from "@/lib/format";

function withEnglishDigits(value: unknown): unknown {
  if (typeof value !== "string") return value;
  return toEnglishDigits(value);
}

export const phoneSchema = z.preprocess(
  withEnglishDigits,
  z
    .string()
    .trim()
    .regex(/^09\d{9}$/, "شماره موبایل باید با ۰۹ شروع و ۱۱ رقم باشد"),
);

const optionalDigitString = z.preprocess(
  withEnglishDigits,
  z.string().trim().optional().or(z.literal("")),
);

const englishNumber = z.preprocess(withEnglishDigits, z.coerce.number());

export const loginSchema = z.object({
  username: z.string().trim().min(3, "نام کاربری حداقل ۳ کاراکتر باشد"),
  password: z.string().min(6, "رمز عبور حداقل ۶ کاراکتر باشد"),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "نام کاربری حداقل ۳ کاراکتر باشد")
      .max(30, "نام کاربری حداکثر ۳۰ کاراکتر باشد")
      .regex(/^[a-zA-Z0-9_.-]+$/, "نام کاربری فقط شامل حروف انگلیسی، عدد و _ . - باشد"),
    password: z.string().min(6, "رمز عبور حداقل ۶ کاراکتر باشد"),
    confirmPassword: z.string().min(6, "تکرار رمز عبور الزامی است"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "رمز عبور و تکرار آن یکسان نیستند",
    path: ["confirmPassword"],
  });

export const onboardingSchema = z.object({
  firstName: z.string().trim().min(2, "نام را وارد کنید"),
  lastName: z.string().trim().min(2, "نام خانوادگی را وارد کنید"),
  birthDate: z.string().trim().min(4, "تاریخ تولد را انتخاب کنید"),
  gender: z.enum(["MALE", "FEMALE"], { message: "جنسیت را انتخاب کنید" }),
  phone: phoneSchema,
});

export const profileSchema = z.object({
  firstName: z.string().trim().min(2, "نام را وارد کنید"),
  lastName: z.string().trim().min(2, "نام خانوادگی را وارد کنید"),
  birthDate: z.string().trim().min(4, "تاریخ تولد را وارد کنید"),
  gender: z.enum(["MALE", "FEMALE"], { message: "جنسیت را انتخاب کنید" }),
  phone: phoneSchema,
  nationalCode: optionalDigitString,
  city: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  postalCode: optionalDigitString,
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "نام دسته‌بندی الزامی است"),
  description: z.string().trim().optional().or(z.literal("")),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "نام محصول الزامی است"),
  description: z.string().trim().optional().or(z.literal("")),
  weight: englishNumber.pipe(z.number().positive("وزن باید بیشتر از صفر باشد")),
  karat: z.preprocess(
    (value) => Number(withEnglishDigits(value)),
    z.union([z.literal(18), z.literal(24)], {
      message: "عیار طلا را انتخاب کنید",
    })
  ),
  wage: englishNumber.pipe(z.number().min(0, "اجرت نمی‌تواند منفی باشد")),
  categoryId: z.string().min(1, "دسته‌بندی را انتخاب کنید"),
  active: z.coerce.boolean().optional().default(true),
});

export const orderStatusSchema = z.enum(["PENDING", "PAID", "FINISHED", "CANCELLED"]);

/** Personal customer discount, 0–100 %. Empty input means "no discount". */
const discountPercentField = z.preprocess(
  (value) => {
    const normalized = withEnglishDigits(value);
    if (normalized === "" || normalized === null || normalized === undefined) return 0;
    return normalized;
  },
  z.coerce
    .number({ message: "درصد تخفیف نامعتبر است" })
    .min(0, "درصد تخفیف نمی‌تواند منفی باشد")
    .max(100, "درصد تخفیف حداکثر ۱۰۰ است")
);

const usernameField = z
  .string()
  .trim()
  .min(3, "نام کاربری حداقل ۳ کاراکتر باشد")
  .max(30, "نام کاربری حداکثر ۳۰ کاراکتر باشد")
  .regex(/^[a-zA-Z0-9_.-]+$/, "نام کاربری فقط شامل حروف انگلیسی، عدد و _ . - باشد");

export const adminCreateUserSchema = z.object({
  username: usernameField,
  password: z.string().min(6, "رمز عبور حداقل ۶ کاراکتر باشد"),
  firstName: z.string().trim().min(2, "نام را وارد کنید"),
  lastName: z.string().trim().min(2, "نام خانوادگی را وارد کنید"),
  phone: phoneSchema,
  gender: z.enum(["MALE", "FEMALE"], { message: "جنسیت را انتخاب کنید" }),
  birthDate: z.string().trim().min(4, "تاریخ تولد را وارد کنید"),
  city: z.string().trim().optional().or(z.literal("")),
  discountPercent: discountPercentField,
});

export const adminUpdateUserSchema = z.object({
  id: z.string().min(1),
  username: usernameField,
  password: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || v.length >= 6, "رمز عبور حداقل ۶ کاراکتر باشد"),
  firstName: z.string().trim().min(2, "نام را وارد کنید"),
  lastName: z.string().trim().min(2, "نام خانوادگی را وارد کنید"),
  phone: phoneSchema,
  gender: z.enum(["MALE", "FEMALE"], { message: "جنسیت را انتخاب کنید" }),
  birthDate: z.string().trim().min(4, "تاریخ تولد را وارد کنید"),
  city: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  nationalCode: optionalDigitString,
  postalCode: optionalDigitString,
  discountPercent: discountPercentField,
  onboarded: z.coerce.boolean().optional().default(true),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
