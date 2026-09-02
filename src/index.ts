import type { Node } from "@/type"
import * as core from "@actions/core"
import { loadConfig } from "@/config"
import { getData } from "@/data"
import { getProfile } from "@/parse"
import { render } from "@/render"
import { runScripts } from "@/runtime"

async function run(): Promise<void> {
  try {
    const config = loadConfig()
    core.debug(`profile_path: ${config.profile}`)
    core.debug(`output_path: ${config.output}`)
    core.debug(`mock_wakatime: ${config.mock}`)
    if (config.apiKey && !config.mock) {
      core.debug(`wakatime_api_key: *** (length ${config.apiKey.length})`)
    }

    const data = await getData(config.apiKey, { mock: config.mock })
    core.debug(`waka.all = ${data.waka.all ? "present" : "null"}, waka.week = ${data.waka.week ? "present" : "null"}`)

    const nodes = await getProfile(config.profile)
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

    core.setOutput("readme_path", config.output)
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
