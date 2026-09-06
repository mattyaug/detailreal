import { NextRequest, NextResponse } from "next/server";

/**
 * Cloudflare OpenNext does not yet support Next.js 16 `proxy.ts` because
 * proxy runs in the Node.js middleware runtime. Keeping this file as
 * `middleware.ts` makes Next use the Edge middleware runtime, which OpenNext
 * supports. Remove this workaround after OpenNext adds proxy.ts support.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase() ?? "";
  const baseDomain = (process.env.NEXT_PUBLIC_BASE_DOMAIN || "nuecesdetail.com").toLowerCase();

  const isAdminHost =
    host === "admin.localhost" ||
    host === "schedule.localhost" ||
    host.startsWith("admin.") ||
    host.startsWith("schedule.") ||
    (baseDomain
      ? host === `admin.${baseDomain}` || host === `schedule.${baseDomain}`
      : false);

  const isBookHost =
    host === "book.localhost" ||
    host.startsWith("book.") ||
    (baseDomain ? host === `book.${baseDomain}` : false);

  const url = request.nextUrl.clone();

  if (isAdminHost) {
    if (url.pathname === "/") {
      url.pathname = "/admin";
      return NextResponse.rewrite(url);
    }

    if (url.pathname === "/login") {
      url.pathname = "/admin/login";
      return NextResponse.rewrite(url);
    }
  }

  if (isBookHost && url.pathname === "/") {
    url.pathname = "/book";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
