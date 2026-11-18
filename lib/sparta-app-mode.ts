export function getSpartaAppMode(configuredMode = process.env.SPARTA_APP_MODE) {
  if (configuredMode === "demo" || configuredMode === "production") {
    return configuredMode
  }

  return "local"
}

export type SessionAuthSource = "demo" | "local" | "sso"

export function allowsSessionInMode(source: unknown, mode = getSpartaAppMode()) {
  if (mode === "production") return source === "sso"
  if (mode === "demo") return source === "demo"
  return source !== "demo"
}
