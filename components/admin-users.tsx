"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
  type ActionState,
} from "@/app/actions/admin";
import type { UserLevel } from "@/lib/user-levels";
import { LEVEL_LABELS } from "@/lib/user-levels";
import { formatPercent, toPersianDigits } from "@/lib/format";
import { DigitsInput } from "@/components/digits-input";
import { JalaliDatePicker } from "@/components/jalali-date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type AdminUserRow = {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  phoneLabel: string;
  city: string | null;
  address: string | null;
  nationalCode: string | null;
  postalCode: string | null;
  birthDate: string | null;
  gender: string | null;
  discountPercent: number;
  onboarded: boolean;
  name: string;
  level: UserLevel;
  orderCount: number;
  createdAtLabel: string;
  totalSpentLabel: string;
};

const LEVEL_BADGE: Record<UserLevel, "secondary" | "gold" | "navy"> = {
  1: "secondary",
  2: "gold",
  3: "navy",
};

export function AdminUsersTable({ users }: { users: AdminUserRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>مشتری</TableHead>
          <TableHead>تلفن</TableHead>
          <TableHead>شهر</TableHead>
          <TableHead>مجموع خرید</TableHead>
          <TableHead>تخفیف</TableHead>
          <TableHead>سطح</TableHead>
          <TableHead>عضویت</TableHead>
          <TableHead>تاریخ ثبت‌نام</TableHead>
          <TableHead>عملیات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={9}
              className="py-10 text-center text-muted-foreground"
            >
              هنوز مشتری‌ای ثبت‌نام نکرده است.
            </TableCell>
          </TableRow>
        )}
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium text-navy">{user.name}</span>
                <span className="text-xs text-muted-foreground" dir="ltr">
                  @{user.username}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-sm" dir="ltr">
              {user.phoneLabel}
            </TableCell>
            <TableCell className="text-sm">{user.city || "—"}</TableCell>
            <TableCell className="font-semibold text-navy">
              {user.totalSpentLabel}
            </TableCell>
            <TableCell>
              {user.discountPercent > 0 ? (
                <Badge variant="success">
                  {toPersianDigits(formatPercent(user.discountPercent))}٪
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              <Badge variant={LEVEL_BADGE[user.level]}>
                {LEVEL_LABELS[user.level]}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={user.onboarded ? "success" : "gold"}>
                {user.onboarded ? "تکمیل‌شده" : "ناقص"}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {user.createdAtLabel}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <UserEditDialog user={user} />
                <DeleteUserButton
                  id={user.id}
                  name={user.name}
                  orderCount={user.orderCount}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function CreateUserButton() {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createUserAction,
    undefined
  );
  const [gender, setGender] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setOpen(false);
      setGender("");
      setFormKey((k) => k + 1);
      router.refresh();
    }
  }, [state, router]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setGender("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant="gold">
          <Plus className="size-4" />
          کاربر جدید
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>افزودن کاربر</DialogTitle>
          <DialogDescription>
            مشتری جدید بسازید. پس از ایجاد می‌تواند با نام کاربری و رمز وارد شود.
          </DialogDescription>
        </DialogHeader>
        <form key={formKey} action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نام کاربری" name="username" dir="ltr" className="text-right" required />
            <Field
              label="رمز عبور"
              name="password"
              type="password"
              dir="ltr"
              className="text-right"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نام" name="firstName" required />
            <Field label="نام خانوادگی" name="lastName" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>تاریخ تولد</Label>
              <JalaliDatePicker name="birthDate" />
            </div>
            <GenderSelect value={gender} onChange={setGender} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="create-phone">موبایل</Label>
              <DigitsInput
                id="create-phone"
                name="phone"
                digitsOnly
                maxLength={11}
                dir="ltr"
                className="text-right"
                required
              />
            </div>
            <Field label="شهر" name="city" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <DiscountField id="create-discount" defaultValue="" />
          </div>
          {state?.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                انصراف
              </Button>
            </DialogClose>
            <Button type="submit" variant="navy" disabled={pending}>
              {pending ? "در حال ایجاد..." : "ایجاد کاربر"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserEditDialog({ user }: { user: AdminUserRow }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateUserAction,
    undefined
  );
  const [gender, setGender] = useState(user.gender ?? "");
  const router = useRouter();

  useEffect(() => {
    if (open) setGender(user.gender ?? "");
  }, [open, user.gender]);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ویرایش کاربر</DialogTitle>
          <DialogDescription>
            اطلاعات «{user.name}» را ویرایش کنید. رمز را خالی بگذارید تا تغییر نکند.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={user.id} />
          <input type="hidden" name="onboarded" value="true" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="نام کاربری"
              name="username"
              defaultValue={user.username}
              dir="ltr"
              className="text-right"
              required
            />
            <Field
              label="رمز جدید (اختیاری)"
              name="password"
              type="password"
              dir="ltr"
              className="text-right"
              placeholder="بدون تغییر"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="نام"
              name="firstName"
              defaultValue={user.firstName ?? ""}
              required
            />
            <Field
              label="نام خانوادگی"
              name="lastName"
              defaultValue={user.lastName ?? ""}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>تاریخ تولد</Label>
              <JalaliDatePicker name="birthDate" value={user.birthDate ?? ""} />
            </div>
            <GenderSelect value={gender} onChange={setGender} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`phone-${user.id}`}>موبایل</Label>
              <DigitsInput
                id={`phone-${user.id}`}
                name="phone"
                defaultValue={user.phone ?? ""}
                digitsOnly
                maxLength={11}
                dir="ltr"
                className="text-right"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`national-${user.id}`}>کد ملی</Label>
              <DigitsInput
                id={`national-${user.id}`}
                name="nationalCode"
                defaultValue={user.nationalCode ?? ""}
                digitsOnly
                maxLength={10}
                dir="ltr"
                className="text-right"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="شهر" name="city" defaultValue={user.city ?? ""} />
            <div className="space-y-2">
              <Label htmlFor={`postal-${user.id}`}>کد پستی</Label>
              <DigitsInput
                id={`postal-${user.id}`}
                name="postalCode"
                defaultValue={user.postalCode ?? ""}
                digitsOnly
                maxLength={10}
                dir="ltr"
                className="text-right"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <DiscountField
              id={`discount-${user.id}`}
              defaultValue={user.discountPercent ? String(user.discountPercent) : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`address-${user.id}`}>آدرس</Label>
            <Textarea
              id={`address-${user.id}`}
              name="address"
              defaultValue={user.address ?? ""}
              rows={2}
            />
          </div>
          {state?.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                انصراف
              </Button>
            </DialogClose>
            <Button type="submit" variant="navy" disabled={pending}>
              {pending ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserButton({
  id,
  name,
  orderCount,
}: {
  id: string;
  name: string;
  orderCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const blocked = orderCount > 0;

  function confirmDelete() {
    startTransition(async () => {
      try {
        await deleteUserAction(id);
        toast.success("کاربر حذف شد");
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
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>حذف کاربر</DialogTitle>
          <DialogDescription>
            {blocked
              ? `کاربر «${name}» دارای سفارش است و قابل حذف نیست.`
              : `آیا از حذف «${name}» مطمئن هستید؟ این عمل قابل بازگشت نیست.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">انصراف</Button>
          </DialogClose>
          {!blocked && (
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={pending}
            >
              {pending ? "در حال حذف..." : "حذف"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GenderSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>جنسیت</Label>
      <input type="hidden" name="gender" value={value} />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={cn(!value && "text-muted-foreground")}>
          <SelectValue placeholder="انتخاب جنسیت" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="MALE">آقا</SelectItem>
          <SelectItem value="FEMALE">خانم</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function DiscountField({
  id,
  defaultValue,
}: {
  id: string;
  defaultValue: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>درصد تخفیف اختصاصی</Label>
      <DigitsInput
        id={id}
        name="discountPercent"
        defaultValue={defaultValue}
        inputMode="decimal"
        placeholder="۰"
        dir="ltr"
        className="text-right"
      />
      <p className="text-xs text-muted-foreground">
        عددی بین ۰ تا ۱۰۰. روی قیمت همه محصولات این مشتری اعمال می‌شود.
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  ...props
}: {
  label: string;
  name: string;
} & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}
