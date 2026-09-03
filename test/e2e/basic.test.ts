import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { runProfile } from "./helpers"

describe("e2e: basic", () => {
  it("profile-basic.md → README.md 匹配 expected", async () => {
    const profile = resolve(__dirname, "fixtures/profile-basic.md")
    const expectedPath = resolve(__dirname, "fixtures/profile-basic.expected.md")

    const readme = await runProfile(profile)
    const expected = readFileSync(expectedPath, "utf-8")

    expect(readme).toBe(expected)
  })
})
