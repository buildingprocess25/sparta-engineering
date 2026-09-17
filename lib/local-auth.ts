import { compare } from "bcryptjs"

import type { UserRole } from "@/generated/prisma"
import { getPrisma } from "@/lib/prisma"

export type LocalAuthUserRecord = {
  NIK: string
  email: string | null
  passwordHash: string
  role: UserRole
}

export type LocalAuthSessionUser = {
  userId: string
  email: string
  role: UserRole
}

export type LocalAuthError =
  | "MISSING_CREDENTIALS"
  | "INVALID_CREDENTIALS"
  | "SERVER_ERROR"

export type LocalAuthResult =
  | {
      ok: true
      user: LocalAuthSessionUser
    }
  | {
      ok: false
      error: LocalAuthError
    }

type LocalAuthInput = {
  email: FormDataEntryValue | string | null | undefined
  password: FormDataEntryValue | string | null | undefined
}

type LocalAuthDeps = {
  findUserByEmail: (email: string) => Promise<LocalAuthUserRecord | null>
  comparePassword: (password: string, hash: string) => Promise<boolean>
}

export async function verifyLocalCredentials(
  input: LocalAuthInput,
  deps: LocalAuthDeps = {
    findUserByEmail,
    comparePassword: compare,
  },
): Promise<LocalAuthResult> {
  const email = normalizeInput(input.email).toLowerCase()
  const password = normalizeInput(input.password)

  if (!email || !password) {
    return { ok: false, error: "MISSING_CREDENTIALS" }
  }

  const user = await deps.findUserByEmail(email)

  if (!user?.email) {
    return { ok: false, error: "INVALID_CREDENTIALS" }
  }

  const passwordMatches = await deps.comparePassword(
    password,
    user.passwordHash,
  )

  if (!passwordMatches) {
    return { ok: false, error: "INVALID_CREDENTIALS" }
  }

  return {
    ok: true,
    user: {
      userId: user.NIK,
      email: user.email,
      role: user.role,
    },
  }
}

function normalizeInput(value: FormDataEntryValue | string | null | undefined) {
  return typeof value === "string" ? value.trim() : ""
}

async function findUserByEmail(email: string) {
  return getPrisma().user.findUnique({
    where: { email },
    select: {
      NIK: true,
      email: true,
      passwordHash: true,
      role: true,
    },
  })
}
