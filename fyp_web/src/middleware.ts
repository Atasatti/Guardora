import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
];

const authRoutes = ["/login", "/forgot-password"];

export async function middleware(request: NextRequest) {
  if (process.env.AUTH_BYPASS === "true") {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  if (token) {
    if (authRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (protectedRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
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
