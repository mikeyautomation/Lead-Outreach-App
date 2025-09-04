import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { EditCampaignForm } from "@/components/edit-campaign-form"

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (campaignError || !campaign) {
    notFound()
  }

  // Get campaign leads
  const { data: campaignLeads, error: leadsError } = await supabase
    .from("campaign_leads")
    .select(`
      *,
      leads (
        id,
        contact_name,
        email,
        company_name,
        status
      )
    `)
    .eq("campaign_id", id)

  if (leadsError) {
    console.error("Error fetching campaign leads:", leadsError)
  }

  return (
    <DashboardLayout currentPage="campaigns">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Campaign</h1>
          <p className="text-muted-foreground mt-2">Update your campaign settings and content.</p>
        </div>

        <EditCampaignForm campaign={campaign} campaignLeads={campaignLeads || []} />
      </div>
    </DashboardLayout>
  )
}
