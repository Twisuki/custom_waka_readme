import type { ContextData } from "@/type"
import ivm from "isolated-vm"

export interface SandboxOptions {
  timeout: number
  memory: number
}

/**
 * isolated-vm 沙箱
 */
export class Sandbox {
  private isolate: ivm.Isolate
  private context: ivm.Context
  private readonly timeout: number

  constructor(data: ContextData, options: SandboxOptions) {
    this.isolate = new ivm.Isolate({ memoryLimit: options.memory })
    this.context = this.isolate.createContextSync()
    const jail = this.context.global
    jail.setSync("waka", data.waka)
    jail.setSync("categories", data.categories)
    jail.setSync("projects", data.projects)
    jail.setSync("languages", data.languages)
    jail.setSync("editors", data.editors)
    jail.setSync("oss", data.oss)
    jail.setSync("dependencies", data.dependencies)
    jail.setSync("machines", data.machines)
    this.timeout = options.timeout
  }

  /**
   * 安全销毁沙箱
   */
  destroy(): void {
    this.isolate.dispose()
  }

  /**
   * 执行脚本
   */
  async run(source: string): Promise<string[]> {
    this.context.evalSync(source, { timeout: this.timeout })
    const ref = this.context.global.getSync("__token__")
    return ref.copySync() as string[]
  }
}
