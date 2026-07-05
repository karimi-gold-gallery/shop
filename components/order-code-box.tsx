"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

import { toPersianDigits } from "@/lib/format";
import { Card } from "@/components/ui/card";

export function OrderCodeBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("کد سفارش کپی شد");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("کپی ناموفق بود");
    }
  }

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="flex flex-col items-center gap-1 bg-secondary/60 p-5 text-center">
        <p className="text-xs text-muted-foreground">کد سفارش شما</p>
        <p className="text-3xl font-extrabold tracking-widest text-navy" dir="ltr">
          {toPersianDigits(code)}
        </p>
        <button
          onClick={copy}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary transition-colors cursor-pointer"
        >
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
          {copied ? "کپی شد" : "کپی کد سفارش"}
        </button>
      </div>
    </Card>
  );
}
