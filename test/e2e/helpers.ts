import type { Node } from "@/type"
import { vi } from "vitest"
import { getData } from "@/data"
import { parse } from "@/parse"
import { runScripts } from "@/runtime"
import { allData, weekData } from "./data"

let mocked = false

export async function runProfile(profilePath: string): Promise<string> {
  if (!mocked) {
    vi.stubGlobal("fetch", async (url: string) => {
      if (url.includes("last_7_days")) {
        return new Response(JSON.stringify({ data: weekData }))
      }
      if (url.includes("all_time")) {
        return new Response(JSON.stringify({ data: allData }))
      }
      return new Response("not found", { status: 404 })
    })
    mocked = true
  }

  const nodes = await parse(profilePath)
  const statics: Node[] = []
  const scripts: Node[] = []
  nodes.forEach((n) => {
    if (n.type === "static")
      statics.push(n)
    else
      scripts.push(n)
  })

  const data = await getData("mock-api-key")
  const results = await runScripts(scripts, data, { timeout: 5000, memory: 64 })

  return [...statics, ...results]
    .toSorted((a, b) => a.index - b.index)
    .map(n => n.content)
    .join("")
}
