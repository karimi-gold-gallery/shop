"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { createProductAction, updateProductAction, deleteProductImageAction, type ActionState } from "@/app/actions/admin";
import type { ProductCardData } from "@/lib/products";
import { DigitsInput } from "@/components/digits-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string };

type Props = {
  categories: Category[];
  product?: ProductCardData & { images: { id: string; mimeType: string }[] };
};

export function AdminProductForm({ categories, product }: Props) {
  const isEdit = !!product;
  const action = isEdit ? updateProductAction : createProductAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, undefined);
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [karat, setKarat] = useState(String(product?.karat ?? 18));
  const [active, setActive] = useState(product?.active ?? true);
  const [_, startTransition] = useTransition();
  const router = useRouter();

  function deleteImage(imageId: string) {
    if (product && product.images.length <= 1) {
      toast.error("حداقل یک تصویر برای محصول الزامی است");
      return;
    }
    startTransition(async () => {
      const result = await deleteProductImageAction(imageId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result?.success ?? "تصویر حذف شد");
      router.refresh();
    });
  }

  return (
    <form action={formAction} className="space-y-5">
      {isEdit && <input type="hidden" name="id" value={product!.id} />}
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="karat" value={karat} />

      <div className="space-y-2">
        <Label htmlFor="name">نام محصول</Label>
        <Input id="name" name="name" defaultValue={product?.name ?? ""} placeholder="مثال: انگشتر طلای سلطنتی" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">توضیحات</Label>
        <Textarea id="description" name="description" defaultValue={product?.description ?? ""} rows={4} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="weight">وزن (گرم)</Label>
          <DigitsInput id="weight" name="weight" type="text" inputMode="decimal" dir="ltr" className="text-right" defaultValue={product?.weight ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">رنگ (اختیاری)</Label>
          <Input
            id="color"
            name="color"
            placeholder="مثال: طلایی، نقره‌ای، مشکی..."
            defaultValue={product?.color ?? ""}
          />
          <p className="text-xs text-muted-foreground leading-4">
            برای محصولات چندرنگ، نام محصول را برای همه‌ی واریانت‌ها یکسان بگذارید تا در صفحه جزئیات گروه‌بندی شوند.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="wage">اجرت ساخت (تومان)</Label>
          <DigitsInput id="wage" name="wage" type="text" digitsOnly inputMode="numeric" dir="ltr" className="text-right" defaultValue={product?.wage ?? 0} />
        </div>
        <div className="space-y-2">
          <Label>عیار طلا</Label>
          <Select value={karat} onValueChange={setKarat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="18">۱۸ عیار</SelectItem>
              <SelectItem value="24">۲۴ عیار</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>دسته‌بندی</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className={cn(!categoryId && "text-muted-foreground")}>
              <SelectValue placeholder="انتخاب دسته" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="active" name="active" checked={active} onCheckedChange={(v) => setActive(v === true)} />
        <Label htmlFor="active" className="cursor-pointer">فعال و قابل نمایش در فروشگاه</Label>
      </div>

      {isEdit && product!.images.length > 0 && (
        <div className="space-y-2">
          <Label>تصاویر فعلی</Label>
          <div className="flex flex-wrap gap-3">
            {product!.images.map((img) => (
              <div key={img.id} className="relative size-24 overflow-hidden rounded-lg border border-border bg-secondary/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/images/${img.id}`} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => deleteImage(img.id)}
                  className="absolute top-1 left-1 grid size-6 place-items-center rounded-full bg-destructive text-destructive-foreground shadow hover:scale-110 transition-transform cursor-pointer"
                  aria-label="حذف تصویر"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="images" className="flex items-center gap-2">
          <ImageIcon className="size-4" />
          {isEdit
            ? product!.images.length === 0
              ? "تصاویر محصول (الزامی)"
              : "افزودن تصاویر جدید (اختیاری)"
            : "تصاویر محصول (الزامی)"}
        </Label>
        <Input
          id="images"
          name="images"
          type="file"
          accept="image/*"
          multiple
          required={!isEdit || product!.images.length === 0}
        />
        <p className="text-xs text-muted-foreground">
          {isEdit
            ? "حداقل یک تصویر باید باقی بماند. می‌توانید تصاویر جدید اضافه کنید."
            : "حداقل یک تصویر الزامی است. می‌توانید چند تصویر انتخاب کنید."}
        </p>
      </div>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" variant="navy" disabled={pending || !categoryId}>
        {pending ? "در حال ذخیره..." : isEdit ? "به‌روزرسانی محصول" : "ایجاد محصول"}
      </Button>
    </form>
  );
}
