import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { defineConfig, type Plugin } from "vite-plus"

import facts from "./copy/facts.json" with { type: "json" }

const svg = (name: string) => readFileSync(resolve(import.meta.dirname, "brand/logo", name), "utf8").trim()
const logo = (name: string) => svg(name).replace(/ fill="#[0-9a-f]+"/, ' fill="currentColor"')

function inline(): Plugin {
  return {
    name: "survay:inline",
    transformIndexHtml: (html) =>
      html
        .replaceAll("<!--wordmark-live-->", svg("survay-live.svg"))
        .replaceAll("<!--wordmark-->", logo("survay.svg"))
        .replaceAll("%demo%", facts.demo)
        .replaceAll("%demo-host%", new URL(facts.demo).host)
        .replaceAll("%repo%", facts.repo)
        .replaceAll("%site%", facts.site),
  }
}

export default defineConfig({
  plugins: [inline()],
  build: { target: "es2022" },
  css: { postcss: {} },
  fmt: { semi: false, ignorePatterns: ["*.html"] },
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
})
