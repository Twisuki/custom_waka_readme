import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { runProfile } from "./helpers"

describe("e2e: block", () => {
  it("代码块定义变量, token 引用, 渲染语言列表", async () => {
    const profile = resolve(__dirname, "fixtures/profile-block.md")
    const expectedPath = resolve(__dirname, "fixtures/profile-block.expected.md")

    const readme = await runProfile(profile)
    const expected = readFileSync(expectedPath, "utf-8")

    expect(readme).toBe(expected)
  })
})
