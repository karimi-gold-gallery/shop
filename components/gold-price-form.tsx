"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { updateGoldPriceAction, type ActionState } from "@/app/actions/admin";
import { toPersianDigits } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GoldPriceForm({ currentPrice }: { currentPrice: number }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateGoldPriceAction, undefined);

  function onSubmit() {
    if (!state?.error) toast.success(state?.success ?? "قیمت طلا به‌روز شد");
  }

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="price">قیمت هر گرم طلا (تومان)</Label>
        <Input
          id="price"
          name="price"
          type="number"
          inputMode="numeric"
          dir="ltr"
          className="text-right"
          defaultValue={currentPrice}
          min={1}
        />
        <p className="text-xs text-muted-foreground">
          قیمت فعلی: {toPersianDigits(new Intl.NumberFormat("fa-IR").format(currentPrice))} تومان
        </p>
      </div>
      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" variant="gold" disabled={pending} className="w-full">
        <Sparkles className="size-4" />
        {pending ? "در حال به‌روزرسانی..." : "به‌روزرسانی قیمت طلا"}
      </Button>
    </form>
  );
}
