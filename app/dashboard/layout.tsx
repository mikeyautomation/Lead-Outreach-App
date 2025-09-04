import type React from "react"

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Lead Outreach</h1>
          </div>
          <nav className="mt-6">
            <a
              href="/dashboard/leads"
              className="block px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Leads
            </a>
            <a
              href="/dashboard/campaigns"
              className="block px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Campaigns
            </a>
            <a
              href="/dashboard/tracking"
              className="block px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Email Tracking
            </a>
            <a
              href="/dashboard/analytics"
              className="block px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Analytics
            </a>
            <a
              href="/dashboard/settings"
              className="block px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Settings
            </a>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <main className="p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
