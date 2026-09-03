import type { Node } from "@/type"
import * as core from "@actions/core"
import { loadConfig } from "@/config"
import { getData } from "@/data"
import { parse } from "@/parse"
import { runScripts } from "@/runtime"

async function run(): Promise<void> {
  try {
    // region config
    const config = loadConfig()
    core.debug(`profile_path: ${config.profile}`)
    core.debug(`output_path: ${config.output}`)
    core.debug(`wakatime_api_key: *** (length ${config.apiKey.length})`)
    // endregion

    // region parse
    const nodes = await parse(config.profile)
    core.debug(`parse: ${nodes.length} nodes`)
    // endregion

    // region waka
    const data = await getData(config.apiKey)
    core.debug(`waka.all = ${data.waka.all ? "present" : "null"}, waka.week = ${data.waka.week ? "present" : "null"}`)
    // endregion

    // region split
    const statics: Node[] = []
    const scripts: Node[] = []
    nodes.forEach((n) => {
      if (n.type === "static")
        statics.push(n)
      else
        scripts.push(n)
    })
    core.debug(`split: statics=${statics.length}, scripts=${scripts.length}`)
    // endregion

    // region runtime
    const results = await runScripts(scripts, data, config.sandbox)
    core.debug(`runScripts: ${results.length} contents`)
    // endregion

    // region render
    const readme = [...statics, ...results]
      .toSorted((a, b) => a.index - b.index)
      .map(n => n.content)
      .join("")
    core.debug(`render: ${readme.length} chars`)
    // endregion

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
