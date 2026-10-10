import { getTitle } from "@/lib/survey"
import { ImageResponse } from "next/og"

export const alt = "Survey"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const dynamic = "force-dynamic"

export default async function OpengraphImage() {
  const title = (await getTitle()) || "A few quick questions"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 40,
          padding: 96,
          background: "#fcfcfa",
          color: "#2b2b29",
        }}
      >
        <div style={{ display: "flex", height: 2, width: "100%", background: "#e4e3df" }}>
          <div style={{ width: "40%", background: "#2b2b29" }} />
        </div>
        <div style={{ fontSize: 76, letterSpacing: -2, lineHeight: 1.15 }}>{title}</div>
      </div>
    ),
    size,
  )
}
