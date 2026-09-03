import type { SandboxOptions } from "@/runtime/sandbox"
import type { ContextData, Node } from "@/type"
import { compile } from "@/runtime/compile"
import { Sandbox } from "@/runtime/sandbox"

/**
 * 运行脚本 Node
 */
export async function runScripts(scripts: Node[], data: ContextData, options: SandboxOptions): Promise<Node[]> {
  const source = compile(scripts)
  const sandbox = new Sandbox(data, options)
  try {
    const results = await sandbox.run(source)
    let tokenIndex = 0
    return scripts.map((n) => {
      if (n.type === "block")
        return { ...n, content: "" }
      if (n.type === "token")
        return { ...n, type: "static", content: String(results[tokenIndex++]) }
      return n
    })
  }
  finally {
    sandbox.destroy()
  }
}
