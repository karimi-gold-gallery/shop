"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LayoutDashboard, LogOut, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import type { SafeUser } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(u: SafeUser) {
  const f = u.firstName?.[0] ?? "";
  const l = u.lastName?.[0] ?? "";
  if (f || l) return `${f}${l}`;
  return u.username.slice(0, 2);
}

export function UserMenu({ user }: { user: SafeUser }) {
  const router = useRouter();

  async function handleLogout() {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (res.ok) {
      toast.success("از حساب کاربری خارج شدید");
      router.push("/");
      router.refresh();
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-border bg-card p-1 pe-3 shadow-sm hover:bg-secondary transition-colors cursor-pointer">
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
              {initials(user)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm font-medium max-w-[90px] truncate">
            {user.firstName || user.username}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span>{user.firstName ? `${user.firstName} ${user.lastName ?? ""}` : user.username}</span>
          <span className="text-xs font-normal text-muted-foreground">@{user.username}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="size-4" />
            پروفایل من
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile?tab=orders">
            <ShoppingCart className="size-4" />
            سفارش‌های من
          </Link>
        </DropdownMenuItem>
        {user.role === "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <LayoutDashboard className="size-4" />
              پنل مدیریت
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="size-4" />
          خروج از حساب
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
