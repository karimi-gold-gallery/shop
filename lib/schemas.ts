import { z } from "zod";

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
  phone: z
    .string()
    .trim()
    .min(11, "شماره موبایل معتبر وارد کنید")
    .regex(/^09\d{9}$/, "شماره موبایل باید با ۰۹ شروع و ۱۱ رقم باشد"),
});

export const profileSchema = z.object({
  firstName: z.string().trim().min(2, "نام را وارد کنید"),
  lastName: z.string().trim().min(2, "نام خانوادگی را وارد کنید"),
  birthDate: z.string().trim().min(4, "تاریخ تولد را وارد کنید"),
  gender: z.enum(["MALE", "FEMALE"], { message: "جنسیت را انتخاب کنید" }),
  phone: z
    .string()
    .trim()
    .min(11, "شماره موبایل معتبر وارد کنید")
    .regex(/^09\d{9}$/, "شماره موبایل باید با ۰۹ شروع و ۱۱ رقم باشد"),
  nationalCode: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  postalCode: z.string().trim().optional().or(z.literal("")),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "نام دسته‌بندی الزامی است"),
  description: z.string().trim().optional().or(z.literal("")),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "نام محصول الزامی است"),
  description: z.string().trim().optional().or(z.literal("")),
  weight: z.coerce.number().positive("وزن باید بیشتر از صفر باشد"),
  wage: z.coerce.number().min(0, "اجرت نمی‌تواند منفی باشد"),
  categoryId: z.string().min(1, "دسته‌بندی را انتخاب کنید"),
  active: z.coerce.boolean().optional().default(true),
});

export const orderStatusSchema = z.enum(["PENDING", "PAID", "FINISHED", "CANCELLED"]);

export const goldPriceSchema = z.object({
  price: z.coerce.number().positive("قیمت طلا باید بیشتر از صفر باشد"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type GoldPriceInput = z.infer<typeof goldPriceSchema>;
