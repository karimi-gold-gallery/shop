import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isMaintenanceMode } from "@/lib/maintenance";

function nextWithPathname(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const maintenanceOn = isMaintenanceMode();

  if (!maintenanceOn) {
    if (pathname === "/maintenance") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return nextWithPathname(request);
  }

  if (pathname === "/maintenance" || pathname === "/floor-guide") {
    return nextWithPathname(request);
  }

  if (pathname === "/api/gold-prices/sync") {
    return nextWithPathname(request);
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
