"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";

import { loginAction, type AuthState } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(loginAction, undefined);

  return (
    <div className="beige-texture flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Image
            src="/logo.png"
            alt="گالری طلا و جواهر کریمی"
            width={288}
            height={288}
            className="mx-auto mb-4 size-36 rounded-2xl object-contain bg-navy shadow-md ring-1 ring-gold/30"
            priority
          />
          <h1 className="text-2xl font-bold text-navy">ورود به گالری کریمی</h1>
          <p className="text-sm text-muted-foreground mt-1">برای ادامه، وارد حساب خود شوید</p>
        </div>

        <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="username">نام کاربری</Label>
            <Input id="username" name="username" placeholder="نام کاربری خود را وارد کنید" autoComplete="username" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">رمز عبور</Label>
            <Input id="password" name="password" type="password" placeholder="رمز عبور" autoComplete="current-password" />
          </div>

          {state?.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" variant="navy" className="w-full" disabled={pending}>
            {pending ? "در حال ورود..." : "ورود"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            حساب کاربری ندارید؟{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">ثبت‌نام کنید</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
