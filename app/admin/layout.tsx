import Link from "next/link";
import Image from "next/image";
import { Home } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Button } from "@/components/ui/button";

export const metadata = { title: "پنل مدیریت" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-28 h-fit">
          <div className="rounded-xl navy-gradient text-navy-foreground p-4">
            <div className="flex items-center gap-2.5 mb-4 px-1">
              <Image
                src="/logo.png"
                alt="گالری کریمی"
                width={112}
                height={112}
                className="size-14 rounded-lg object-contain bg-navy ring-1 ring-gold/30"
              />
              <div className="leading-tight">
                <p className="font-bold text-sm">پنل مدیریت</p>
                <p className="text-[11px] text-navy-foreground/60">@{admin.username}</p>
              </div>
            </div>
            <AdminSidebar />
            <div className="mt-4 border-t border-navy-foreground/15 pt-3">
              <Button asChild variant="ghost" size="sm" className="w-full justify-start text-navy-foreground/70 hover:text-navy-foreground hover:bg-navy-foreground/10">
                <Link href="/">
                  <Home className="size-4" />
                  بازگشت به فروشگاه
                </Link>
              </Button>
            </div>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
