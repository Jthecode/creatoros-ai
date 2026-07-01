import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const protectedRoutes = [
    "/dashboard",
    "/ai-builder",
    "/products",
    "/orders",
    "/customers",
    "/analytics",
    "/ai-employees",
    "/settings",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const supabaseAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("sb-"));

  if (!supabaseAuthCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/ai-builder/:path*",
    "/products/:path*",
    "/orders/:path*",
    "/customers/:path*",
    "/analytics/:path*",
    "/ai-employees/:path*",
    "/settings/:path*",
  ],
};