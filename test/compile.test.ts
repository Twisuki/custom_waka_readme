/* eslint-disable no-template-curly-in-string */
import type { Node } from "@/type"
import { describe, expect, it } from "vitest"
import { compile } from "@/runtime/compile"

function node(type: Node["type"], line: number, content: string, index = 0): Node {
  return { type, index, line, content }
}

describe("compile", () => {
  it("空数组: 仅生成 wrapper, 无节点行", () => {
    expect(compile([])).toMatchInlineSnapshot(`
      "let __flag__
      var __token__ = []
      try {
        __flag__ = null
      }
      catch (e) {
        const f = __flag__
        throw f ? new Error('profile.md:' + f.line + ' (' + f.type + ') ' + e.message) : e
      }"
    `)
  })

  it("纯 static: 跳过, 不写入 token, 不写 __flag__", () => {
    const out = compile([node("static", 1, "hello")])
    expect(out).not.toContain("__token__[")
    expect(out).not.toContain("__flag__ = { type: \"static\"")
    expect(out).toContain("__flag__ = null")
  })

  it("单 token: 包裹括号, 写入 __token__[0]", () => {
    const out = compile([node("token", 5, "waka.all.time")])
    expect(out).toContain("__token__[0] = (waka.all.time)")
    expect(out).toContain("line: 5")
  })

  it("单 block: 原样嵌入 content", () => {
    const out = compile([node("block", 10, "const x = 1\nconst y = 2")])
    expect(out).toContain("const x = 1")
    expect(out).toContain("const y = 2")
    expect(out).toContain("line: 10")
  })

  it("混合: 按数组顺序, token index 连续递增", () => {
    expect(compile([
      node("block", 5, "const a = 1", 0),
      node("token", 7, "a", 1),
      node("block", 10, "const b = a + 1", 2),
      node("token", 12, "b", 3),
    ])).toMatchInlineSnapshot(`
      "let __flag__
      var __token__ = []
      try {
        __flag__ = { type: "block", line: 5 }
        const a = 1
        __flag__ = { type: "token", line: 7 }
        __token__[0] = (a)
        __flag__ = { type: "block", line: 10 }
        const b = a + 1
        __flag__ = { type: "token", line: 12 }
        __token__[1] = (b)
        __flag__ = null
      }
      catch (e) {
        const f = __flag__
        throw f ? new Error('profile.md:' + f.line + ' (' + f.type + ') ' + e.message) : e
      }"
    `)
  })

  it("block content 含 ${ 不被 host 求值", () => {
    const out = compile([node("block", 1, "const x = `\${unknown}`")])
    expect(out).toContain("const x = `${unknown}`")
    expect(out).not.toContain("undefined")
  })

  it("token content 含 ${ 不被 host 求值", () => {
    const out = compile([node("token", 1, "`\${unknown}`")])
    expect(out).toContain("__token__[0] = (`${unknown}`)")
  })

  it("catch 块抛错格式: profile.md:{line} ({type}) {msg}", () => {
    const out = compile([])
    expect(out).toContain("'profile.md:' + f.line + ' (' + f.type + ') ' + e.message")
  })

  it("__flag__ = null 写在最后一个 token 之后", () => {
    const out = compile([node("token", 1, "1")])
    expect(out.indexOf("__flag__ = null")).toBeGreaterThan(out.indexOf("__token__[0]"))
  })
})
