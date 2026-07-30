import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth-token";

const protectedRoutes = [
  "/",
  "/users",
  "/surveillance",
  "/incidents",
  "/visitors",
  "/map",
  "/maintenance",
  "/facilities",
  "/finance",
  "/announcements",
  "/moderation",
  "/marketplace",
  "/broadcast",
  "/resident",
];

const authRoutes = ["/login", "/forgot-password"];

export async function proxy(request: NextRequest) {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.AUTH_BYPASS === "true"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;
  const jwtSecret = process.env.JWT_SECRET_KEY;
  const tokenIsValid = Boolean(
    token &&
      jwtSecret &&
      (await verifySessionToken(token, jwtSecret))
  );

  if (tokenIsValid) {
    if (authRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  const isProtected = protectedRoutes.some((route) =>
    route === "/" ? pathname === "/" : pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isProtected) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    if (token) {
      response.cookies.delete("token");
    }
    return response;
  }

  const response = NextResponse.next();
  if (token) {
    response.cookies.delete("token");
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.png (your logo file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)",
  ],
};
