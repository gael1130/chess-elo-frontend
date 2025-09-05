import "./globals.css"
import { ReactNode } from "react"
import { Analytics } from "@vercel/analytics/react"
import dynamic from "next/dynamic"
import { ClerkProvider } from '@clerk/nextjs'

const MainNavigationClient = dynamic(
  () => import("@/components/ui/MainNavigation").then(m => m.MainNavigation),
  { ssr: false }
)

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head />
        <body className="min-h-screen app-surface text-slate-50">
          <MainNavigationClient />
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
