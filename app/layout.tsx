import "./globals.css"
import { ReactNode } from "react"
import { Analytics } from "@vercel/analytics/react"
import { ClerkProvider } from '@clerk/nextjs'
import { MainNavigation } from "@/components/ui/MainNavigation"

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head />
        <body className="min-h-screen app-surface text-slate-50">
          <MainNavigation />
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
