import { NextResponse, type NextRequest } from "next/server";
import { decryptSession } from "@/lib/session";

const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/about",
  "/programs",
  "/coaches",
  "/players",
  "/matches",
  "/gallery",
  "/contact",
  "/apply",
];

const ROLE_PREFIX: Record<string, string> = {
  ADMIN: "/dashboard",
  COACH: "/coach",
  STUDENT: "/student",
  PARENT: "/parent",
};

// Modules shared by admin + coach (data-scoped server-side).
const SHARED_MODULE_PATHS = [
  "/students",
  "/attendance",
  "/performance",
  "/dashboard/matches",
  "/rankings",
  "/goals",
  "/training",
  "/reports",
  "/scan",
];

// Modules restricted to ADMIN (financial, staff, system, user management).
const ADMIN_ONLY_MODULE_PATHS = [
  "/expenses",
  "/fees",
  "/dashboard/coaches",
  "/settings",
  "/users",
  "/audit-logs",
  "/admissions",
];

// Modules available to every authenticated role.
const ANY_ROLE_MODULE_PATHS = ["/notifications", "/profile"];

// Every path owned by the authenticated application. Unknown paths are
// allowed through so Next.js can render the custom 404 page.
const AUTHED_PATHS = [
  ...SHARED_MODULE_PATHS,
  ...ADMIN_ONLY_MODULE_PATHS,
  ...ANY_ROLE_MODULE_PATHS,
  "/dashboard",
  "/coach",
  "/student",
  "/parent",
  "/packages",
  "/forbidden",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname === "/" ||
    pathname.startsWith("/scan/") ||
    pathname.startsWith("/api/");

  const token = request.cookies.get("yfa_session")?.value;
  const session = await decryptSession(token);

  if (isPublic) {
    if (session?.userId && pathname === "/") {
      const dest = ROLE_PREFIX[session.role] ?? "/dashboard";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  const isKnownAuthedPath = AUTHED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!isKnownAuthedPath) {
    return NextResponse.next();
  }

  if (!session?.userId) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  // Admin-only modules.
  const isAdminOnlyModule = ADMIN_ONLY_MODULE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isAdminOnlyModule) {
    if (session.role === "ADMIN") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL(ROLE_PREFIX[session.role], request.url));
  }

  // Shared modules: admin + coach only.
  const isSharedModule = SHARED_MODULE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isSharedModule) {
    if (session.role === "ADMIN" || session.role === "COACH") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL(ROLE_PREFIX[session.role], request.url));
  }

  // Modules available to any authenticated user.
  const isAnyRoleModule = ANY_ROLE_MODULE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isAnyRoleModule) {
    return NextResponse.next();
  }

  // Portal-specific paths.
  const prefix = ROLE_PREFIX[session.role];
  if (!pathname.startsWith(prefix)) {
    return NextResponse.redirect(new URL(prefix, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|uploads|.*\\.(?:svg|png|jpg|jpeg|webp|ico|json|txt|js|webmanifest)$).*)",
  ],
};
