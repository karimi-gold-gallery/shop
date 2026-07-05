"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteProductAction } from "@/app/actions/admin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      try {
        await deleteProductAction(productId);
        toast.success("محصول حذف شد");
        setOpen(false);
      } catch {
        toast.error("حذف ناموفق بود");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>حذف محصول</DialogTitle>
          <DialogDescription>
            آیا از حذف «{productName}» مطمئن هستید؟ این عمل قابل بازگشت نیست.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">انصراف</Button>
          </DialogClose>
          <Button variant="destructive" disabled={pending} onClick={confirmDelete}>
            {pending ? "در حال حذف..." : "حذف"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
