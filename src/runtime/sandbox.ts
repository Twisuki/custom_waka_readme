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
    jail.setSync("waka", data.waka, { copy: true })
    jail.setSync("categories", data.categories, { copy: true })
    jail.setSync("projects", data.projects, { copy: true })
    jail.setSync("languages", data.languages, { copy: true })
    jail.setSync("editors", data.editors, { copy: true })
    jail.setSync("oss", data.oss, { copy: true })
    jail.setSync("dependencies", data.dependencies, { copy: true })
    jail.setSync("machines", data.machines, { copy: true })
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
  async run(source: string): Promise<unknown[]> {
    this.context.evalSync(source, { timeout: this.timeout })
    const ref = this.context.global.getSync("__token__")
    return ref.copySync() as unknown[]
  }
}
