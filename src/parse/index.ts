import type { Node } from "@/type"
import { readFile } from "node:fs/promises"
import { parseText } from "@/parse/parse"

/**
 * 读取 profile 模板并解析为有序 Node[]
 */
export async function parse(name: string): Promise<Node[]> {
  let text: string
  try {
    text = await readFile(name, "utf-8")
  }
  catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    throw new Error(`failed to read profile "${name}": ${msg}`)
  }
  return parseText(text)
}
