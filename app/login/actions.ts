"use server"

import { notFound, redirect } from "next/navigation"

import { DEMO_ACCOUNTS, DEMO_BRANCH } from "@/lib/demo-accounts"
import { verifyLocalCredentials, type LocalAuthError } from "@/lib/local-auth"
import { getPrisma } from "@/lib/prisma"
import { createSession, deleteSession } from "@/lib/session"
import { getSpartaAppMode } from "@/lib/sparta-app-mode"

export type LoginFormState = {
  message: string
  email: string
}

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  if (getSpartaAppMode() !== "local") redirect("/login")

  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  let shouldRedirect = false

  try {
    const result = await verifyLocalCredentials({ email, password })

    if (!result.ok) {
      return {
        message: getLoginErrorMessage(result.error),
        email,
      }
    }

    await createSession(result.user.userId, result.user.email, result.user.role)
    shouldRedirect = true
  } catch (error) {
    console.error("Local login failed", error)

    return {
      message: "Login belum bisa diproses. Coba lagi beberapa saat.",
      email,
    }
  }

  if (shouldRedirect) {
    redirect("/dashboard")
  }

  return {
    message: "",
    email: "",
  }
}

export async function demoLoginAction(formData: FormData) {
  if (getSpartaAppMode() !== "demo") notFound()

  const account = DEMO_ACCOUNTS.find((entry) => entry.key === formData.get("account"))
  if (!account) redirect("/login?error=demo-account")

  let signedIn = false
  try {
    const user = await getPrisma().user.findUnique({
      where: {
        NIK: account.nik,
        role: account.role,
        branchName: DEMO_BRANCH,
      },
      select: { NIK: true, email: true, role: true },
    })
    if (user?.email) {
      await createSession(user.NIK, user.email, user.role, "demo")
      signedIn = true
    }
  } catch (error) {
    console.error("Demo login failed", error)
  }

  redirect(signedIn ? "/dashboard" : "/login?error=demo-account")
}

export async function logoutAction() {
  await deleteSession()
  redirect("/login")
}

function getLoginErrorMessage(error: LocalAuthError) {
  if (error === "MISSING_CREDENTIALS") {
    return "Email dan password wajib diisi."
  }

  return "Email atau password tidak sesuai."
}
