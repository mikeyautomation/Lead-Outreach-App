import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { EmailTrackingDashboard } from "@/components/email-tracking-dashboard"

export default async function EmailTrackingPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get email tracking data
  const { data: emailTracking, error: trackingError } = await supabase
    .from("email_tracking")
    .select(`
      *,
      leads (
        id,
        contact_name,
        email,
        company_name
      ),
      campaigns (
        id,
        name
      )
    `)
    .order("sent_at", { ascending: false })
    .limit(100)

  if (trackingError) {
    console.error("Error fetching email tracking:", trackingError)
  }

  // Get campaign performance data
  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (campaignsError) {
    console.error("Error fetching campaigns:", campaignsError)
  }

  return (
    <DashboardLayout currentPage="tracking">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Email Tracking</h1>
          <p className="text-muted-foreground mt-2">Monitor email performance and engagement metrics.</p>
        </div>

        <EmailTrackingDashboard emailTracking={emailTracking || []} campaigns={campaigns || []} />
      </div>
    </DashboardLayout>
  )
}
