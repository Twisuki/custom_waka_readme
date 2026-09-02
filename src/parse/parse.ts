import type { Node } from "@/type"

const START_TAG = "<!--CUSTOM_WAKA_START-->"
const END_TAG = "<!--CUSTOM_WAKA_END-->"
const TOKEN_REGEX = /\{[^{}\n]*\}/g

type Draft = Omit<Node, "index">

export class ParseError extends Error {
  constructor(
    message: string,
    public line: number,
    public kind: "block",
  ) {
    super(message)
    this.name = "ParseError"
  }
}

/**
 * 计算 offset 处所在的源行号 (1-based)
 */
function lineOf(text: string, offset: number): number {
  let line = 1
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === "\n")
      line++
  }
  return line
}

/**
 * 在 [start, end) 范围内切分 static / token 节点, push 到 drafts
 */
function tokenize(
  text: string,
  start: number,
  end: number,
  drafts: Draft[],
): void {
  const regex = TOKEN_REGEX
  regex.lastIndex = start
  let lastEnd = start
  let match: RegExpExecArray | null = regex.exec(text)

  while (match !== null && match.index < end) {
    if (match.index > lastEnd) {
      drafts.push({
        type: "static",
        line: lineOf(text, lastEnd),
        content: text.slice(lastEnd, match.index),
      })
    }
    drafts.push({
      type: "token",
      line: lineOf(text, match.index),
      content: match[0].slice(1, -1),
    })
    lastEnd = match.index + match[0].length
    match = regex.exec(text)
  }

  if (lastEnd < end) {
    drafts.push({
      type: "static",
      line: lineOf(text, lastEnd),
      content: text.slice(lastEnd, end),
    })
  }
}

/**
 * 把 profile.md 文本解析为 Node[]
 */
export async function parseText(text: string): Promise<Node[]> {
  const drafts: Draft[] = []
  let cursor = 0

  while (cursor < text.length) {
    const blockStart = text.indexOf(START_TAG, cursor)
    if (blockStart === -1) {
      tokenize(text, cursor, text.length, drafts)
      break
    }

    const blockEnd = text.indexOf(END_TAG, blockStart)
    if (blockEnd === -1) {
      throw new ParseError(
        "unclosed code block",
        lineOf(text, blockStart),
        "block",
      )
    }

    tokenize(text, cursor, blockStart, drafts)

    drafts.push({
      type: "block",
      line: lineOf(text, blockStart),
      content: text.slice(blockStart + START_TAG.length, blockEnd),
    })

    cursor = blockEnd + END_TAG.length
  }

  return drafts.map((n, i) => ({ ...n, index: i }))
}
