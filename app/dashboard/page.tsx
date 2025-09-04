import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, Mail, TrendingUp } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get dashboard stats
  const [leadsResult, campaignsResult] = await Promise.all([
    supabase.from("leads").select("id, status").eq("user_id", user.id),
    supabase.from("campaigns").select("id, status, sent_count, opened_count").eq("user_id", user.id),
  ])

  const totalLeads = leadsResult.data?.length || 0
  const activeLeads = leadsResult.data?.filter((lead) => lead.status === "active").length || 0
  const totalCampaigns = campaignsResult.data?.length || 0
  const totalSent = campaignsResult.data?.reduce((sum, campaign) => sum + (campaign.sent_count || 0), 0) || 0

  const stats = [
    {
      title: "Total Leads",
      value: totalLeads.toString(),
      description: `${activeLeads} active leads`,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Campaigns",
      value: totalCampaigns.toString(),
      description: "Active campaigns",
      icon: Target,
      color: "text-secondary",
    },
    {
      title: "Emails Sent",
      value: totalSent.toString(),
      description: "Total outreach emails",
      icon: Mail,
      color: "text-accent",
    },
    {
      title: "Response Rate",
      value: "0%",
      description: "Average response rate",
      icon: TrendingUp,
      color: "text-muted-foreground",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back! Here's an overview of your lead outreach.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
            <CardDescription>Your latest lead management activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a
                href="/dashboard/leads/new"
                className="flex items-center gap-3 p-3 rounded-md border border-border hover:bg-muted transition-colors"
              >
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Add New Lead</span>
              </a>
              <a
                href="/dashboard/campaigns/new"
                className="flex items-center gap-3 p-3 rounded-md border border-border hover:bg-muted transition-colors"
              >
                <Target className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium text-foreground">Create Campaign</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
