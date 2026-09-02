import type { Node } from "@/type"
import * as core from "@actions/core"
import { getData } from "@/data"
import { getProfile } from "@/parse"
import { render } from "@/render"
import { runScripts } from "@/runtime"

interface ActionInputs {
  profilePath: string
  outputPath: string
  wakatimeApiKey: string
  mockWakatime: boolean
  commitAuthor: string
  commitEmail: string
  commitMessage: string
}

function readInputs(): ActionInputs {
  return {
    profilePath: core.getInput("profile_path") || "profile.md",
    outputPath: core.getInput("output_path") || "README.md",
    wakatimeApiKey: core.getInput("wakatime_api_key"),
    mockWakatime: core.getBooleanInput("mock_wakatime"),
    commitAuthor: core.getInput("commit_author"),
    commitEmail: core.getInput("commit_email"),
    commitMessage: core.getInput("commit_message"),
  }
}

async function run(): Promise<void> {
  try {
    const inputs = readInputs()

    core.debug(`profile_path: ${inputs.profilePath}`)
    core.debug(`output_path: ${inputs.outputPath}`)
    core.debug(`mock_wakatime: ${inputs.mockWakatime}`)
    if (inputs.wakatimeApiKey && !inputs.mockWakatime) {
      core.debug(`wakatime_api_key: *** (length ${inputs.wakatimeApiKey.length})`)
    }

    const data = await getData(inputs.wakatimeApiKey, { mock: inputs.mockWakatime })
    core.debug(`waka.all = ${data.waka.all ? "present" : "null"}, waka.week = ${data.waka.week ? "present" : "null"}`)

    const nodes = await getProfile(inputs.profilePath)
    core.debug(`getProfile: ${nodes.length} nodes`)

    const statics: Node[] = []
    const scripts: Node[] = []
    nodes.forEach((n) => {
      if (n.type === "static")
        statics.push(n)
      else
        scripts.push(n)
    })
    core.debug(`split: statics=${statics.length}, scripts=${scripts.length}`)

    const contents = await runScripts(scripts, data)
    core.debug(`runScripts: ${contents.length} contents`)

    const readme = await render([...statics, ...contents])
    core.debug(`render: ${readme.length} chars`)

    // TODO: 写入 README.md, 内容变更时触发 commit

    core.setOutput("readme_path", inputs.outputPath)
    core.setOutput("changed", "false")
    core.info("custom_waka_readme data layer ok (scaffolding)")
  }
  catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    core.setFailed(msg)
  }
}

// eslint-disable-next-line antfu/no-top-level-await
await run()
