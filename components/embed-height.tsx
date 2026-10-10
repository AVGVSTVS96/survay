"use client"

import { useEffect } from "react"

export function EmbedHeight() {
  useEffect(() => {
    const root = document.documentElement
    root.dataset.embed = ""
    const post = () =>
      window.parent.postMessage(
        { type: "survay:height", height: Math.ceil(document.body.getBoundingClientRect().height) },
        "*",
      )
    const observer = new ResizeObserver(post)
    observer.observe(document.body)
    return () => {
      observer.disconnect()
      delete root.dataset.embed
    }
  }, [])

  return null
}
