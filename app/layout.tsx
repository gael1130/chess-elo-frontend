import "./globals.css"
import { ReactNode } from "react"
import { Analytics } from "@vercel/analytics/react"
import { MainNavigation } from "@/components/ui/MainNavigation"


interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head />
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <MainNavigation />
        {children}
        <Analytics />
      </body>
    </html>
  )
}