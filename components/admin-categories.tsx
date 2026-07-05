"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  type ActionState,
} from "@/app/actions/admin";
import { toPersianDigits } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

type Category = { id: string; name: string; description: string | null; count: number };

export function AdminCategories({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createCategoryAction, undefined);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">مدیریت دسته‌بندی‌ها</h1>
        <p className="text-sm text-muted-foreground">{toPersianDigits(categories.length)} دسته‌بندی</p>
      </div>

      <Card className="p-5">
        <h2 className="font-bold text-navy mb-1">افزودن دسته‌بندی جدید</h2>
        <p className="text-sm text-muted-foreground mb-4">دسته‌بندی جدید برای محصولات ایجاد کنید.</p>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <div className="space-y-2">
              <Label htmlFor="name">نام دسته</Label>
              <Input id="name" name="name" placeholder="مثال: انگشتر" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">توضیحات (اختیاری)</Label>
              <Input id="description" name="description" placeholder="توضیح کوتاه" />
            </div>
          </div>
          {state?.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
          )}
          {state?.success && (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p>
          )}
          <Button type="submit" variant="navy" disabled={pending}>
            <Plus className="size-4" />
            {pending ? "در حال افزودن..." : "افزودن دسته"}
          </Button>
        </form>
      </Card>

      <div className="space-y-2">
        {categories.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">هنوز دسته‌بندی‌ای ایجاد نشده است.</Card>
        )}
        {categories.map((c) => (
          <Card key={c.id} className="flex items-center justify-between p-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-navy">{c.name}</p>
                <Badge variant="secondary">{toPersianDigits(c.count)} محصول</Badge>
              </div>
              {c.description && <p className="text-xs text-muted-foreground mt-1">{c.description}</p>}
            </div>
            <div className="flex items-center gap-1">
              <CategoryEditDialog category={c} />
              <DeleteCategoryButton id={c.id} name={c.name} count={c.count} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CategoryEditDialog({ category }: { category: Category }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateCategoryAction, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ویرایش دسته‌بندی</DialogTitle>
          <DialogDescription>نام و توضیحات دسته را ویرایش کنید.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={category.id} />
          <div className="space-y-2">
            <Label htmlFor={`name-${category.id}`}>نام</Label>
            <Input id={`name-${category.id}`} name="name" defaultValue={category.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`desc-${category.id}`}>توضیحات</Label>
            <Textarea id={`desc-${category.id}`} name="description" defaultValue={category.description ?? ""} rows={3} />
          </div>
          {state?.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" type="button">انصراف</Button></DialogClose>
            <Button type="submit" variant="navy" disabled={pending}>
              {pending ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCategoryButton({ id, name, count }: { id: string; name: string; count: number }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function confirmDelete() {
    startTransition(async () => {
      try {
        await deleteCategoryAction(id);
        toast.success("دسته‌بندی حذف شد");
        setOpen(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "حذف ناموفق بود");
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
          <DialogTitle>حذف دسته‌بندی</DialogTitle>
          <DialogDescription>
            {count > 0
              ? `دسته «${name}» دارای ${toPersianDigits(count)} محصول است و قابل حذف نیست. ابتدا محصولات را جابجا یا حذف کنید.`
              : `آیا از حذف دسته «${name}» مطمئن هستید؟`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">انصراف</Button></DialogClose>
          <Button variant="destructive" disabled={pending || count > 0} onClick={confirmDelete}>
            {pending ? "در حال حذف..." : "حذف"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
