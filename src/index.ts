import type { Config, Node } from "@/type"
import { writeFile } from "node:fs/promises"
import * as core from "@actions/core"
import { commit } from "@/commit"
import { loadConfig } from "@/config"
import { getData } from "@/data"
import { log } from "@/logger"
import { parse } from "@/parse"
import { runScripts } from "@/runtime"

async function run(): Promise<void> {
  let config: Config | undefined
  try {
    // region config
    config = loadConfig()
    log.info("profile_path:", config.profile)
    log.info("output_path:", config.output)
    log.info(`wakatime_token: *** (length ${config.token.length})`)
    // endregion

    // region parse
    const nodes = await parse(config.profile)
    log.info("parse:", nodes.length, "nodes")
    // endregion

    // region waka
    const data = await getData(config.token)
    log.info("waka.all =", data.waka.all ? "present" : "null", "waka.week =", data.waka.week ? "present" : "null")
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
    log.info("split: statics =", statics.length, "scripts =", scripts.length)
    // endregion

    // region runtime
    const results = await runScripts(scripts, data, config.sandbox)
    log.info("runScripts:", results.length, "contents")
    // endregion

    // region render
    const readme = [...statics, ...results]
      .toSorted((a, b) => a.index - b.index)
      .map(n => n.content)
      .join("")
    log.info("render:", readme.length, "chars")
    // endregion

    // region commit
    await writeFile(config.output, readme, "utf-8")
    await commit(config.output, config)
    core.setOutput("readme_path", config.output)
    log.info("custom_waka_readme done")
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
