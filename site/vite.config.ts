import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { defineConfig, type Plugin } from "vite-plus"

const logo = (name: string) =>
  readFileSync(resolve(import.meta.dirname, "brand/logo", name), "utf8")
    .trim()
    .replace(/ fill="#[0-9a-f]+"/, ' fill="currentColor"')

function inlineLogos(): Plugin {
  return {
    name: "survay:logos",
    transformIndexHtml: (html) =>
      html.replaceAll("<!--wordmark-->", logo("survay.svg")).replaceAll("<!--mark-->", logo("mark.svg")),
  }
}

export default defineConfig({
  plugins: [inlineLogos()],
  build: { target: "es2022" },
  css: { postcss: {} },
  fmt: { semi: false, ignorePatterns: ["*.html"] },
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
})
