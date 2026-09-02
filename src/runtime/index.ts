import type { ContextData, Node } from "@/type"

/**
 * 在沙箱中执行 scripts 节点, 返回全新 Node[]
 */
export async function runScripts(_scripts: Node[], _data: ContextData): Promise<Node[]> {
  throw new Error("TODO: runScripts")
}
