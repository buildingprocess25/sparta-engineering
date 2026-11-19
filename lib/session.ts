import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts"
import { allowsSessionInMode, type SessionAuthSource } from "@/lib/sparta-app-mode"

const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

export type SessionPayload = {
  userId: string
  email: string
  role: string
  expiresAt: Date
  authSource?: SessionAuthSource
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    })
    if (!allowsSessionInMode(payload.authSource)) return null
    if (payload.authSource === "demo" && !DEMO_ACCOUNTS.some(({ nik }) => nik === payload.userId)) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

export async function createSession(
  userId: string,
  email: string,
  role: string,
  authSource: SessionAuthSource = "local",
) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, email, role, expiresAt, authSource })

  const cookieStore = await cookies()
  cookieStore.set("sparta_engineering_session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  })
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get("sparta_engineering_session")?.value
  if (!session) return null
  return await decrypt(session)
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete("sparta_engineering_session")
}
