"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { Users, Mail, BarChart3, Settings, LogOut, Menu, X, Target } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  currentPage?: string
}

export function DashboardLayout({ children, currentPage }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const navigation = [
    { name: "Leads", href: "/dashboard/leads", icon: Users, current: currentPage === "leads" },
    { name: "Campaigns", href: "/dashboard/campaigns", icon: Target, current: currentPage === "campaigns" },
    { name: "Email Tracking", href: "/dashboard/tracking", icon: Mail, current: currentPage === "tracking" },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, current: currentPage === "analytics" },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, current: currentPage === "settings" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-black/20 dark:bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border shadow-lg">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h1 className="text-xl font-bold text-foreground">Lead Outreach</h1>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="p-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.current
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="absolute bottom-16 left-4 right-4">
            <div className="flex justify-center mb-4">
              <ThemeToggle />
            </div>
            <Button variant="outline" onClick={handleSignOut} className="w-full bg-transparent">
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64 lg:block">
        <div className="flex h-full flex-col bg-card border-r border-border shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h1 className="text-xl font-bold text-foreground">Lead Outreach</h1>
            <ThemeToggle />
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.current
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-border">
            <Button variant="outline" onClick={handleSignOut} className="w-full bg-transparent">
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Lead Outreach</h1>
            <ThemeToggle />
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
