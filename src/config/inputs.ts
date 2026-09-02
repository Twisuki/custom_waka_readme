import type { Config } from "@/type"
import * as core from "@actions/core"

/**
 * 从 GitHub Action 环境读取 inputs, 返回 Config 形状
 */
export function readActionInputs(): Config {
  return {
    profile: core.getInput("profile_path") || "profile.md",
    output: core.getInput("output_path") || "README.md",
    apiKey: core.getInput("wakatime_api_key"),
    mock: core.getBooleanInput("mock_wakatime"),
    commit: {
      author: core.getInput("commit_author"),
      email: core.getInput("commit_email"),
      message: core.getInput("commit_message"),
    },
  }
}
