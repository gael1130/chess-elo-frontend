import "./globals.css"
import { ReactNode } from "react"
import { Analytics } from "@vercel/analytics/react"
import { MainNavigation } from "@/components/ui/MainNavigation"
import { ClerkProvider } from '@clerk/nextjs'

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head />
        <body className="min-h-screen bg-slate-950 text-slate-50">
          <MainNavigation />
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}