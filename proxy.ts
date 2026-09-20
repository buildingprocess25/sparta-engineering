import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { decrypt } from "./lib/session"

const protectedRoutes = ["/dashboard"]
const publicRoutes = ["/login", "/auth/sso/callback"]

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))
  const isPublicRoute = publicRoutes.some((route) => path.startsWith(route))

  const sessionCookie = request.cookies.get("sparta_engineering_session")?.value
  const session = await decrypt(sessionCookie)

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.nextUrl))
  }

  if (isPublicRoute && session && path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
