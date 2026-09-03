import { build } from "esbuild"

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  external: ["isolated-vm"],
  alias: { "@": "./src" },
  outfile: "dist/index.cjs",
})
