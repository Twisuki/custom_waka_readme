import antfu from "@antfu/eslint-config"

export default antfu({
  type: "lib",
  typescript: true,
  stylistic: {
    quotes: "double",
  },
  formatters: {
    markdown: true,
  },
  ignores: [
    "test/e2e/fixtures/**",
    "test/waka/**",
  ],
})
