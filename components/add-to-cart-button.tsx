"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { addToCartAction } from "@/app/actions/cart";
import { Button } from "@/components/ui/button";

export function AddToCartButton({
  productId,
  variant = "default",
  size = "default",
  className,
  label = "افزودن به سبد",
}: {
  productId: string;
  variant?: "default" | "navy" | "gold";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setPending(true);
    try {
      const res = await addToCartAction(productId);
      if (res.status === "login") {
        toast.message("برای افزودن به سبد ابتدا وارد شوید");
        router.push("/login");
        return;
      }
      toast.success("به سبد خرید اضافه شد");
      router.refresh();
    } catch {
      toast.error("افزودن به سبد ناموفق بود");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      onClick={handleClick}
    >
      <ShoppingBag className="size-4" />
      {pending ? "در حال افزودن..." : label}
    </Button>
  );
}
