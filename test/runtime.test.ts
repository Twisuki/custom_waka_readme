import type { ContextData, Node } from "@/type"
import { describe, expect, it } from "vitest"
import { runScripts } from "@/runtime"
import { compile } from "@/runtime/compile"
import { Sandbox } from "@/runtime/sandbox"

function emptyContext(): ContextData {
  const nullRange = { all: null, week: null }
  return {
    waka: nullRange,
    categories: nullRange,
    projects: nullRange,
    languages: nullRange,
    editors: nullRange,
    oss: nullRange,
    dependencies: nullRange,
    machines: nullRange,
  }
}

function node(type: Node["type"], line: number, content: string, index = 0): Node {
  return { type, index, line, content }
}

describe("sandbox", () => {
  it("注入 waka 后沙箱内可读", async () => {
    const sandbox = new Sandbox(emptyContext(), { timeout: 1000, memory: 64 })
    try {
      const source = compile([node("token", 1, "String(waka.all)", 0)])
      const results = await sandbox.run(source)
      expect(results).toEqual(["null"])
    }
    finally {
      sandbox.destroy()
    }
  })

  it("destroy 后再 run 抛错", async () => {
    const sandbox = new Sandbox(emptyContext(), { timeout: 1000, memory: 64 })
    sandbox.destroy()
    await expect(sandbox.run("__token__[0] = 1")).rejects.toThrow()
  })
})

describe("runScripts", () => {
  it("单 block + 单 token: 返回替换后的 Node[]", async () => {
    const scripts: Node[] = [
      node("block", 5, "const x = 42", 0),
      node("token", 7, "x", 1),
    ]
    const out = await runScripts(scripts, emptyContext(), { timeout: 1000, memory: 64 })
    expect(out).toHaveLength(2)
    expect(out[0]).toMatchObject({ type: "block", content: "", line: 5 })
    expect(out[1]).toMatchObject({ type: "static", content: "42", line: 7 })
  })

  it("多 token: 按数组顺序对应 results[i]", async () => {
    const scripts: Node[] = [
      node("token", 1, "1 + 1", 0),
      node("token", 2, "2 + 2", 1),
      node("token", 3, "3 + 3", 2),
    ]
    const out = await runScripts(scripts, emptyContext(), { timeout: 1000, memory: 64 })
    expect(out.map(n => n.content)).toEqual(["2", "4", "6"])
  })

  it("跨 block 共享 const", async () => {
    const scripts: Node[] = [
      node("block", 1, "const greeting = 'hi'", 0),
      node("token", 3, "greeting + ' there'", 1),
      node("block", 5, "const louder = greeting.toUpperCase()", 2),
      node("token", 7, "greeting + ' / ' + louder", 3),
    ]
    const out = await runScripts(scripts, emptyContext(), { timeout: 1000, memory: 64 })
    expect(out[1].content).toBe("hi there")
    expect(out[3].content).toBe("hi / HI")
  })

  it("block 抛错: message 含 profile.md:{line} (block)", async () => {
    const scripts: Node[] = [
      node("block", 7, "throw new Error('boom')", 0),
    ]
    await expect(
      runScripts(scripts, emptyContext(), { timeout: 1000, memory: 64 }),
    ).rejects.toThrow(/profile\.md:7 \(block\) boom/)
  })

  it("token 抛错: message 含 profile.md:{line} (token)", async () => {
    const scripts: Node[] = [
      node("token", 12, "undefinedVar.foo", 0),
    ]
    await expect(
      runScripts(scripts, emptyContext(), { timeout: 1000, memory: 64 }),
    ).rejects.toThrow(/profile\.md:12 \(token\)/)
  })

  it("纯 static nodes: 透传不修改", async () => {
    const scripts: Node[] = [
      node("static", 1, "hello", 0),
      node("static", 2, "world", 1),
    ]
    const out = await runScripts(scripts, emptyContext(), { timeout: 1000, memory: 64 })
    expect(out).toEqual(scripts)
  })
})
