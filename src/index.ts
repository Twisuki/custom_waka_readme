import * as core from "@actions/core"
import { getData } from "@/data"

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

    // TODO: 后续任务接入 parser / runtime / output — 把 data 注入沙箱求值, 写 README, commit

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
