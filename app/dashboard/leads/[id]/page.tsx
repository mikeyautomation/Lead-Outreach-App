import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EditLeadForm } from "@/components/edit-lead-form"

interface LeadDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (leadError || !lead) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Edit Lead</h1>
        <p className="text-muted-foreground mt-2">Update the contact information for this lead.</p>
      </div>

      <EditLeadForm lead={lead} />
    </div>
  )
}
