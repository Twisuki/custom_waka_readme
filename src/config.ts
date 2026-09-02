import type { Config } from "@/type"
import * as core from "@actions/core"

const DEFAULTS = {
  profile: "profile.md",
  output: "README.md",
  commit: {
    author: "waka_bot",
    email: "41898282+github-actions[bot]@users.noreply.github.com",
    message: "feat: Update custom waka readme",
  },
  sandbox: {
    timeout: 10000,
    memory: 128,
  },
} as const

/**
 * 从 GitHub Action 环境读取 inputs, 返回 Config
 */
export function loadConfig(): Config {
  return {
    profile: core.getInput("profile_path") || DEFAULTS.profile,
    output: core.getInput("output_path") || DEFAULTS.output,
    apiKey: core.getInput("wakatime_api_key"),
    commit: {
      author: core.getInput("commit_author") || DEFAULTS.commit.author,
      email: core.getInput("commit_email") || DEFAULTS.commit.email,
      message: core.getInput("commit_message") || DEFAULTS.commit.message,
    },
    sandbox: {
      timeout: Number(core.getInput("sandbox_timeout")) || DEFAULTS.sandbox.timeout,
      memory: Number(core.getInput("sandbox_memory")) || DEFAULTS.sandbox.memory,
    },
  }
}
