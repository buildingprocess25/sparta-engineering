import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  verifyLocalCredentials,
  type LocalAuthUserRecord,
} from "./local-auth"

const validUser: LocalAuthUserRecord = {
  NIK: "ES001",
  email: "engineer@example.com",
  passwordHash: "hashed-password",
  role: "ES",
}

describe("verifyLocalCredentials", () => {
  it("returns a session user when email and password match", async () => {
    const result = await verifyLocalCredentials(
      { email: " ENGINEER@example.com ", password: "secret" },
      {
        findUserByEmail: async (email) => {
          assert.equal(email, "engineer@example.com")
          return validUser
        },
        comparePassword: async (password, hash) => {
          assert.equal(password, "secret")
          assert.equal(hash, "hashed-password")
          return true
        },
      },
    )

    assert.deepEqual(result, {
      ok: true,
      user: {
        userId: "ES001",
        email: "engineer@example.com",
        role: "ES",
      },
    })
  })

  it("rejects missing credentials before querying storage", async () => {
    const result = await verifyLocalCredentials(
      { email: " ", password: "" },
      {
        findUserByEmail: async () => {
          throw new Error("storage should not be queried")
        },
        comparePassword: async () => true,
      },
    )

    assert.deepEqual(result, {
      ok: false,
      error: "MISSING_CREDENTIALS",
    })
  })

  it("rejects unknown email with an invalid credentials error", async () => {
    const result = await verifyLocalCredentials(
      { email: "missing@example.com", password: "secret" },
      {
        findUserByEmail: async () => null,
        comparePassword: async () => {
          throw new Error("password should not be compared")
        },
      },
    )

    assert.deepEqual(result, {
      ok: false,
      error: "INVALID_CREDENTIALS",
    })
  })

  it("rejects a password mismatch with an invalid credentials error", async () => {
    const result = await verifyLocalCredentials(
      { email: "engineer@example.com", password: "wrong" },
      {
        findUserByEmail: async () => validUser,
        comparePassword: async () => false,
      },
    )

    assert.deepEqual(result, {
      ok: false,
      error: "INVALID_CREDENTIALS",
    })
  })
})
