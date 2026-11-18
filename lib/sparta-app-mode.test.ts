import assert from "node:assert/strict"
import test from "node:test"

import { allowsSessionInMode, getSpartaAppMode } from "./sparta-app-mode"

test("demo must be enabled explicitly and unknown values retain local login", () => {
  assert.equal(getSpartaAppMode("demo"), "demo")
  assert.equal(getSpartaAppMode("production"), "production")
  assert.equal(getSpartaAppMode(""), "local")
  assert.equal(getSpartaAppMode("typo"), "local")
})

test("leaving demo invalidates demo sessions and production accepts only SSO", () => {
  assert.equal(allowsSessionInMode("demo", "demo"), true)
  assert.equal(allowsSessionInMode("local", "demo"), false)
  assert.equal(allowsSessionInMode("sso", "demo"), false)
  assert.equal(allowsSessionInMode("demo", "local"), false)
  assert.equal(allowsSessionInMode("demo", "production"), false)
  assert.equal(allowsSessionInMode(undefined, "local"), true)
  assert.equal(allowsSessionInMode(undefined, "production"), false)
  assert.equal(allowsSessionInMode("local", "production"), false)
  assert.equal(allowsSessionInMode("sso", "production"), true)
})
