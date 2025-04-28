import "./globals.css"
import { ReactNode } from "react"
import { Analytics } from "@vercel/analytics/react"

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head />
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}