import type { Config } from "@/type"
import { readActionInputs } from "./inputs"

/**
 * 加载完整 Config
 */
export function loadConfig(): Config {
  const inputs = readActionInputs()
  // TODO: 读取 inputs.profile 指向的 profile.md, 解析 YAML frontmatter, 按优先级合并
  return inputs
}
