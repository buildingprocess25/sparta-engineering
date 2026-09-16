import { NextRequest, NextResponse } from "next/server"
import { getPrisma } from "../../../../lib/prisma"
import { createSession } from "../../../../lib/session"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=MissingToken", request.url))
  }

  const spartaApiUrl = process.env.SPARTA_API_URL || "http://localhost:10000"

  try {
    // 1. Exchange token with SPARTA Login Portal
    const response = await fetch(`${spartaApiUrl}/v1/sso/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleId: "engineering",
        launchToken: token,
      }),
    })

    if (!response.ok) {
      console.error("SSO Exchange failed:", await response.text())
      return NextResponse.redirect(new URL("/login?error=InvalidToken", request.url))
    }

    const { data } = await response.json()
    const email = data?.user?.email

    if (!email) {
      return NextResponse.redirect(new URL("/login?error=InvalidPayload", request.url))
    }

    // 2. Find local user
    const prisma = getPrisma()
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=UserNotFound", request.url))
    }

    // 3. Create Local Session
    await createSession(user.NIK, user.email as string, user.role)

    // 4. Redirect to Dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url))
    
  } catch (error) {
    console.error("SSO Error:", error)
    return NextResponse.redirect(new URL("/login?error=ServerError", request.url))
  }
}
