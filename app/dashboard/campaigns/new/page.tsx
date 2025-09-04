import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CreateCampaignForm } from "@/components/create-campaign-form"

export default async function NewCampaignPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user's leads for selection
  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("id, contact_name, email, company_name, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (leadsError) {
    console.error("Error fetching leads:", leadsError)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Create Campaign</h1>
        <p className="text-muted-foreground mt-2">Set up a new email outreach campaign with follow-up sequences.</p>
      </div>

      <CreateCampaignForm leads={leads || []} />
    </div>
  )
}
