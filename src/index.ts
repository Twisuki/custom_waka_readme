import type { Config, Node } from "@/type"
import { writeFile } from "node:fs/promises"
import * as core from "@actions/core"
import { commit } from "@/commit"
import { loadConfig } from "@/config"
import { getData } from "@/data"
import { parse } from "@/parse"
import { runScripts } from "@/runtime"

async function run(): Promise<void> {
  let config: Config | undefined
  try {
    // region config
    config = loadConfig()
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

    // region commit
    await writeFile(config.output, readme, "utf-8")
    await commit(config.output, config)
    core.setOutput("readme_path", config.output)
    core.info("custom_waka_readme done")
    // endregion
  }
  catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    const m = err.message.match(/^profile\.md:(\d+) \((block|token)\) ([\s\S]*)$/)
    if (m && config) {
      core.error(m[3], {
        file: config.profile,
        startLine: Number(m[1]),
      })
    }
    core.setFailed(err.message)
  }
}

void run()
