import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get comprehensive analytics data
  const [leadsResult, campaignsResult, emailTrackingResult, campaignLeadsResult] = await Promise.all([
    supabase.from("leads").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),

    supabase.from("campaigns").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),

    supabase
      .from("email_tracking")
      .select(`
        *,
        leads!inner (
          user_id
        )
      `)
      .eq("leads.user_id", user.id)
      .order("sent_at", { ascending: false }),

    supabase
      .from("campaign_leads")
      .select(`
        *,
        leads!inner (
          user_id
        ),
        campaigns!inner (
          user_id
        )
      `)
      .eq("leads.user_id", user.id),
  ])

  const leads = leadsResult.data || []
  const campaigns = campaignsResult.data || []
  const emailTracking = emailTrackingResult.data || []
  const campaignLeads = campaignLeadsResult.data || []

  return (
    <DashboardLayout currentPage="analytics">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into your lead outreach performance and trends.
          </p>
        </div>

        <AnalyticsDashboard
          leads={leads}
          campaigns={campaigns}
          emailTracking={emailTracking}
          campaignLeads={campaignLeads}
        />
      </div>
    </DashboardLayout>
  )
}
