"use server"

import { redirect } from "next/navigation"

import { verifyLocalCredentials, type LocalAuthError } from "@/lib/local-auth"
import { createSession, deleteSession } from "@/lib/session"

export type LoginFormState = {
  message: string
  email: string
}

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
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
