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

  it("双层 {{x}}: 切三段 static, 拼回字面量 {x}", async () => {
    const nodes = await withProfile("{{x}}")
    expect(nodes).toEqual([
      { type: "static", index: 0, line: 1, content: "{" },
      { type: "static", index: 1, line: 1, content: "x" },
      { type: "static", index: 2, line: 1, content: "}" },
    ])
  })

  it("三层 {{{x}}}: 外层各保留一个, 拼回 {{x}}", async () => {
    const nodes = await withProfile("{{{x}}}")
    expect(nodes).toEqual([
      { type: "static", index: 0, line: 1, content: "{{" },
      { type: "static", index: 1, line: 1, content: "x" },
      { type: "static", index: 2, line: 1, content: "}}" },
    ])
  })

  it("不平衡 {{x}: 左侧多一个 {, 不剥离, 内部走 token", async () => {
    const nodes = await withProfile("{{x}")
    expect(nodes).toEqual([
      { type: "static", index: 0, line: 1, content: "{" },
      { type: "token", index: 1, line: 1, content: "x" },
    ])
  })

  it("不平衡 {x}}: 右侧多一个 }, 不剥离, 内部走 token", async () => {
    const nodes = await withProfile("{x}}")
    expect(nodes).toEqual([
      { type: "token", index: 0, line: 1, content: "x" },
      { type: "static", index: 1, line: 1, content: "}" },
    ])
  })

  it("双层与单层混合 {{a}}{b}: 各自正确判定", async () => {
    const nodes = await withProfile("{{a}}{b}")
    expect(nodes).toEqual([
      { type: "static", index: 0, line: 1, content: "{" },
      { type: "static", index: 1, line: 1, content: "a" },
      { type: "static", index: 2, line: 1, content: "}" },
      { type: "token", index: 3, line: 1, content: "b" },
    ])
  })

  it("多层与前后静态混合: 行号与内容正确", async () => {
    const nodes = await withProfile(
      "before {{x}} mid\n"
      + "{y} after",
    )
    expect(nodes).toEqual([
      { type: "static", index: 0, line: 1, content: "before {" },
      { type: "static", index: 1, line: 1, content: "x" },
      { type: "static", index: 2, line: 1, content: "} mid\n" },
      { type: "token", index: 3, line: 2, content: "y" },
      { type: "static", index: 4, line: 2, content: " after" },
    ])
  })
})
