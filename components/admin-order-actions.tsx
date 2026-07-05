"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, BadgeCheck, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { updateOrderStatusAction, deleteOrderAction } from "@/app/actions/admin";
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

export function OrderActions({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();

  function setStatus(status: string, label: string) {
    startTransition(async () => {
      try {
        await updateOrderStatusAction(orderId, status);
        toast.success(`سفارش ${label} شد`);
        router.refresh();
      } catch {
        toast.error("عملیات ناموفق بود");
      }
    });
  }

  function remove() {
    startTransition(async () => {
      try {
        await deleteOrderAction(orderId);
        toast.success("سفارش حذف شد");
        router.push("/admin/orders");
      } catch {
        toast.error("حذف ناموفق بود");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus !== "PAID" && (
        <Button variant="secondary" size="sm" disabled={pending} onClick={() => setStatus("PAID", "پرداخت")}>
          <BadgeCheck className="size-4" /> علامت‌گذاری پرداخت‌شده
        </Button>
      )}
      {currentStatus !== "FINISHED" && (
        <Button variant="gold" size="sm" disabled={pending} onClick={() => setStatus("FINISHED", "تکمیل")}>
          <CheckCircle2 className="size-4" /> پرداخت و تکمیل شد
        </Button>
      )}
      {currentStatus !== "CANCELLED" && (
        <Button variant="outline" size="sm" disabled={pending} onClick={() => setStatus("CANCELLED", "لغو")}>
          <XCircle className="size-4" /> لغو سفارش
        </Button>
      )}
      {currentStatus !== "PENDING" && (
        <Button variant="ghost" size="sm" disabled={pending} onClick={() => setStatus("PENDING", "در انتظار")}>
          <RotateCcw className="size-4" /> بازگشت به انتظار
        </Button>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="size-4" /> حذف سفارش
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف سفارش</DialogTitle>
            <DialogDescription>آیا از حذف این سفارش مطمئن هستید؟ این عمل قابل بازگشت نیست.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">انصراف</Button></DialogClose>
            <Button variant="destructive" disabled={pending} onClick={remove}>
              {pending ? "در حال حذف..." : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
