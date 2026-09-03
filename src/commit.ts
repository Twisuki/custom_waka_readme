import type { Config } from "@/type"
import * as core from "@actions/core"
import { exec } from "@actions/exec"

/**
 * 提交到 git 仓库
 */
export async function commit(path: string, config: Config): Promise<void> {
  const { commit } = config
  await exec("git", ["config", "user.name", commit.author])
  await exec("git", ["config", "user.email", commit.email])
  await exec("git", ["add", path])
  await exec("git", [
    "commit",
    "-m",
    commit.message,
    "--author",
    `${commit.author} <${commit.email}>`,
  ])
  await exec("git", ["push"])
  core.info(`committed and pushed: ${path}`)
}
