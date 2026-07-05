"use client";

import { useActionState, useState } from "react";
import { Diamond, UserCircle } from "lucide-react";

import { onboardingAction, type AuthState } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { JalaliDatePicker } from "@/components/jalali-date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(onboardingAction, undefined);
  const [gender, setGender] = useState<string>("");

  return (
    <div className="beige-texture flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <span className="inline-grid size-14 place-items-center rounded-full gold-gradient text-white shadow-md mb-3">
            <UserCircle className="size-7" />
          </span>
          <h1 className="text-2xl font-bold text-navy">تکمیل پروفایل</h1>
          <p className="text-sm text-muted-foreground mt-1">
            برای اولین بار وارد شده‌اید؛ لطفاً اطلاعات خود را وارد کنید
          </p>
        </div>

        <form action={formAction} className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">نام</Label>
              <Input id="firstName" name="firstName" placeholder="نام خود را وارد کنید" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">نام خانوادگی</Label>
              <Input id="lastName" name="lastName" placeholder="نام خانوادگی" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>تاریخ تولد (شمسی)</Label>
              <JalaliDatePicker name="birthDate" placeholder="تاریخ تولد را انتخاب کنید" />
            </div>
            <div className="space-y-2">
              <Label>جنسیت</Label>
              <input type="hidden" name="gender" value={gender} />
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className={cn(!gender && "text-muted-foreground")}>
                  <SelectValue placeholder="جنسیت را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">آقا</SelectItem>
                  <SelectItem value="FEMALE">خانم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">شماره موبایل</Label>
            <Input
              id="phone"
              name="phone"
              inputMode="numeric"
              dir="ltr"
              className="text-right"
              placeholder="09123456789"
            />
            <p className="text-xs text-muted-foreground">مثال: 09120000000</p>
          </div>

          {state?.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" variant="navy" className="w-full" disabled={pending}>
            {pending ? "در حال ذخیره..." : "ذخیره و ادامه"}
          </Button>

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Diamond className="size-3 text-gold" />
            اطلاعات شما محرمانه نزد گالری کریمی نگه‌داری می‌شود.
          </p>
        </form>
      </div>
    </div>
  );
}
