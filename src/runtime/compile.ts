import type { Node } from "@/type"

/**
 * 编译脚本 Node 为代码块
 */
export function compile(nodes: Node[]): string {
  let tokenIndex = 0
  const lines: string[] = []
  for (const node of nodes) {
    if (node.type === "static")
      continue
    lines.push(`  __flag__ = { type: ${JSON.stringify(node.type)}, line: ${node.line} }`)
    if (node.type === "block") {
      lines.push(`  ${node.content}`)
    }
    else if (node.type === "token") {
      lines.push(`  __token__[${tokenIndex}] = (${node.content})`)
      tokenIndex++
    }
  }
  lines.push("  __flag__ = null")

  return [
    "let __flag__",
    "var __token__ = []",
    "try {",
    lines.join("\n"),
    "}",
    "catch (e) {",
    "  const f = __flag__",
    "  throw f ? new Error('profile.md:' + f.line + ' (' + f.type + ') ' + e.message) : e",
    "}",
  ].join("\n")
}
