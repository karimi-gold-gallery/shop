"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { updateCartQuantityAction, removeFromCartAction } from "@/app/actions/cart";
import { Button } from "@/components/ui/button";

type Props = {
  itemId: string;
  quantity: number;
  name: string;
};

export function CartItemRow({ itemId, quantity, name }: Props) {
  const [pending, startTransition] = useTransition();

  function setQty(q: number) {
    startTransition(async () => {
      await updateCartQuantityAction(itemId, q);
    });
  }

  function remove() {
    startTransition(async () => {
      await removeFromCartAction(itemId);
      toast.success(`${name} از سبد حذف شد`);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-md border border-border bg-background">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={pending}
          onClick={() => setQty(quantity - 1)}
          aria-label="کاهش"
        >
          <Minus className="size-3.5" />
        </Button>
        <span className="w-8 text-center text-sm font-medium">{quantity}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={pending}
          onClick={() => setQty(quantity + 1)}
          aria-label="افزایش"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        disabled={pending}
        onClick={remove}
        aria-label="حذف"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
