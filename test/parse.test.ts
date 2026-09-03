import type { Node } from "@/type"
import { mkdtemp, rm, writeFile as writeFileAsync } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { parse } from "@/parse"

let dir: string

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "parse-"))
})

afterAll(async () => {
  await rm(dir, { recursive: true, force: true })
})

async function withProfile(text: string): Promise<Node[]> {
  const path = join(dir, `${Math.random().toString(36).slice(2)}.md`)
  await writeFileAsync(path, text, "utf-8")
  return parse(path)
}

describe("parse", () => {
  it("纯静态文本: 单个 static 节点", async () => {
    const nodes = await withProfile("# Hello")
    expect(nodes).toEqual([
      { type: "static", index: 0, line: 1, content: "# Hello" },
    ])
  })

  it("单 token: 切出 token 节点, content 去括号", async () => {
    const nodes = await withProfile("{waka.week.time}")
    expect(nodes).toEqual([
      { type: "token", index: 0, line: 1, content: "waka.week.time" },
    ])
  })

  it("混合: static + token + block 按源序排列", async () => {
    const nodes = await withProfile(
      "# Hi\n"
      + "\n"
      + "Time: {waka.week.time}\n"
      + "\n"
      + "<!--CUSTOM_WAKA_START-->\n"
      + "const x = 1\n"
      + "<!--CUSTOM_WAKA_END-->\n"
      + "\n"
      + "{x}",
    )
    expect(nodes.map(n => n.type)).toEqual(["static", "token", "static", "block", "static", "token"])
    expect(nodes[0].content).toBe("# Hi\n\nTime: ")
    expect(nodes[3].content).toBe("const x = 1\n")
  })

  it("index 连续递增", async () => {
    const nodes = await withProfile("a {b} c {d} e")
    expect(nodes.map(n => n.index)).toEqual([0, 1, 2, 3, 4])
  })

  it("行号: token/block 在源中的行号", async () => {
    const nodes = await withProfile(
      "# line 1\n"
      + "\n"
      + "{t1}\n"
      + "<!--CUSTOM_WAKA_START-->\n"
      + "x\n"
      + "<!--CUSTOM_WAKA_END-->\n"
      + "{t2}",
    )
    expect(nodes[0].line).toBe(1)
    expect(nodes[1].line).toBe(3)
    expect(nodes[2].line).toBe(3)
    expect(nodes[3].line).toBe(4)
    expect(nodes[4].line).toBe(7)
  })

  it("跨行大括号: 不识别为 token, 当 static 字面量", async () => {
    const nodes = await withProfile("{\nfoo}")
    expect(nodes).toEqual([
      { type: "static", index: 0, line: 1, content: "{\nfoo}" },
    ])
  })

  it("block 未闭合: 抛 ParseError, 标注起始注释行", async () => {
    await expect(withProfile(
      "\n"
      + "<!--CUSTOM_WAKA_START-->\n"
      + "const x = 1",
    )).rejects.toThrow(/unclosed code block/)
  })

  it("读取不存在路径: 抛出 wrapped 错误", async () => {
    await expect(parse(join(dir, "does-not-exist.md"))).rejects.toThrow(/failed to read profile/)
  })
})
