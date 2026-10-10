"use client"

import { useState } from "react"

export function CopyLink() {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(window.location.origin)
    setCopied(true)
  }

  return (
    <button
      type="button"
      onClick={copy}
      onBlur={() => setCopied(false)}
      onMouseLeave={() => setCopied(false)}
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  )
}
