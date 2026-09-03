import type { Node } from "@/type"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { getData } from "@/data"
import { parse } from "@/parse"
import { runScripts } from "@/runtime"
import { runProfile } from "./helpers"

describe("e2e: error", () => {
  it("token 抛错: message 含 profile.md:{line} (token)", async () => {
    await runProfile(resolve(__dirname, "fixtures/profile-basic.md"))

    const errorProfile = resolve(__dirname, "fixtures/profile-error.md")
    const nodes = await parse(errorProfile)
    const scripts: Node[] = []
    nodes.forEach((n) => {
      if (n.type !== "static")
        scripts.push(n)
    })

    const data = await getData("mock-api-key")
    await expect(
      runScripts(scripts, data, { timeout: 5000, memory: 64 }),
    ).rejects.toThrow(/profile\.md:3 \(token\)/)
  })
})
