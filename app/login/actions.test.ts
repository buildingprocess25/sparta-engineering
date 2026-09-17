import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { describe, it } from "node:test"

describe("login server actions module", () => {
  it("only exports async server values", async () => {
    const source = await readFile("app/login/actions.ts", "utf8")

    assert.doesNotMatch(source, /export\s+\{\s*initialLoginFormState\s*\}/)
    assert.doesNotMatch(source, /export\s+const\s+initialLoginFormState/)
    assert.match(source, /export\s+async\s+function\s+loginAction/)
    assert.match(source, /export\s+async\s+function\s+logoutAction/)
  })
})
