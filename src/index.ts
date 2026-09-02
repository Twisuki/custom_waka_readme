import * as core from "@actions/core"

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

    // TODO: 具体实现流程后续补充

    core.setOutput("readme_path", inputs.outputPath)
    core.setOutput("changed", "false")
    core.info("custom_waka_readme scaffolding ok (no-op)")
  }
  catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    core.setFailed(msg)
  }
}

// eslint-disable-next-line antfu/no-top-level-await
await run()
