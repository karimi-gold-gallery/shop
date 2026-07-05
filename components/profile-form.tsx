"use client";

import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { updateProfileAction, type AuthState } from "@/app/actions/auth";
import type { SafeUser } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { JalaliDatePicker } from "@/components/jalali-date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function ProfileForm({ user }: { user: SafeUser }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(updateProfileAction, undefined);
  const [gender, setGender] = useState(user.gender ?? "");

  function handleSubmit() {
    toast.success("اطلاعات پروفایل به‌روز شد");
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="نام" id="firstName" defaultValue={user.firstName ?? ""} />
        <Field label="نام خانوادگی" id="lastName" defaultValue={user.lastName ?? ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>تاریخ تولد (شمسی)</Label>
          <JalaliDatePicker name="birthDate" value={user.birthDate ?? ""} />
        </div>
        <div className="space-y-2">
          <Label>جنسیت</Label>
          <input type="hidden" name="gender" value={gender} />
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className={cn(!gender && "text-muted-foreground")}>
              <SelectValue placeholder="انتخاب جنسیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">آقا</SelectItem>
              <SelectItem value="FEMALE">خانم</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="شماره موبایل" id="phone" defaultValue={user.phone ?? ""} dir="ltr" className="text-right" inputMode="numeric" />
        <Field label="کد ملی" id="nationalCode" defaultValue={user.nationalCode ?? ""} dir="ltr" className="text-right" inputMode="numeric" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="شهر" id="city" defaultValue={user.city ?? ""} />
        <Field label="کد پستی" id="postalCode" defaultValue={user.postalCode ?? ""} dir="ltr" className="text-right" inputMode="numeric" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">آدرس</Label>
        <Textarea id="address" name="address" defaultValue={user.address ?? ""} placeholder="آدرس کامل پستی" />
      </div>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" variant="navy" disabled={pending}>
        <Save className="size-4" />
        {pending ? "در حال ذخیره..." : "ذخیره تغییرات"}
      </Button>
    </form>
  );
}

function Field({
  label,
  id,
  defaultValue,
  dir,
  className,
  inputMode,
}: {
  label: string;
  id: string;
  defaultValue?: string;
  dir?: string;
  className?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} defaultValue={defaultValue} dir={dir} className={className} inputMode={inputMode} />
    </div>
  );
}
