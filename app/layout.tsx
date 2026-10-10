import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const host = process.env.VERCEL_PROJECT_PRODUCTION_URL

export const metadata: Metadata = {
  metadataBase: host ? new URL(`https://${host}`) : undefined,
  title: { default: "Survey", template: "%s · Survey" },
  description: "A calm, minimal survey.",
  openGraph: { title: "Survey", description: "A calm, minimal survey.", type: "website" },
  twitter: { card: "summary_large_image" },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfa" },
    { media: "(prefers-color-scheme: dark)", color: "#2b2b29" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} bg-background`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
