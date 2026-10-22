import { inspect } from "node:util"
import { error, info } from "@actions/core"

function format(args: unknown[]): string {
  return args
    .map(a => (typeof a === "string" ? a : inspect(a, { depth: 4, colors: false })))
    .join(" ")
}

export const log = {
  info(...args: unknown[]): void {
    info(`[INFO] ${format(args)}`)
  },
  error(...args: unknown[]): void {
    error(`[ERROR] ${format(args)}`)
  },
}
