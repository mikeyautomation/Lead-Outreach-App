import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LeadsTable } from "@/components/leads-table"
import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"
import Link from "next/link"

export default async function LeadsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (leadsError) {
    console.error("Error fetching leads:", leadsError)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-2">Manage your lead database and track outreach progress.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/leads/import">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/leads/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Link>
          </Button>
        </div>
      </div>

      <LeadsTable leads={leads || []} />
    </div>
  )
}
