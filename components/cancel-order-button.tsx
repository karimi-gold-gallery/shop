"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { toast } from "sonner";

import { cancelOrderAction } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function cancel() {
    startTransition(async () => {
      const result = await cancelOrderAction(orderId);
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      toast.success("سفارش لغو شد");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-destructive hover:text-destructive">
          <XCircle className="size-4" />
          لغو سفارش
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>لغو سفارش</DialogTitle>
          <DialogDescription>
            آیا از لغو این سفارش مطمئن هستید؟ پس از لغو، وضعیت سفارش به «لغو شده» تغییر می‌کند.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={pending}>
              انصراف
            </Button>
          </DialogClose>
          <Button variant="destructive" disabled={pending} onClick={cancel}>
            {pending ? "در حال لغو..." : "بله، لغو شود"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
