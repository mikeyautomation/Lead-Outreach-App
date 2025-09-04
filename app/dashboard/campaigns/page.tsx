import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CampaignsTable } from "@/components/campaigns-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function CampaignsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (campaignsError) {
    console.error("Error fetching campaigns:", campaignsError)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-2">Create and manage your email outreach campaigns.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/campaigns/new">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Link>
        </Button>
      </div>

      <CampaignsTable campaigns={campaigns || []} />
    </div>
  )
}
