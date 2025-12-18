import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { NotificationCenter } from "@/components/notification-center"
import "./globals.css"
import LanguageToggle from "@/components/language-toggle"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Spend Analyzer - Track Your Expenses",
  description:
    "Mobile-first expense tracking with recurring items, subscriptions, and budgets. Support for English, Tamil, and Thanglish.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <LanguageToggle />
        <NotificationCenter />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
