import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isMaintenanceMode } from "@/lib/maintenance";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const maintenanceOn = isMaintenanceMode();

  if (!maintenanceOn) {
    if (pathname === "/maintenance") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/maintenance") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "سایت در حال بروزرسانی است. لطفاً بعداً مراجعه کنید." },
      { status: 503, headers: { "Retry-After": "3600" } },
    );
  }

  return NextResponse.redirect(new URL("/maintenance", request.url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
