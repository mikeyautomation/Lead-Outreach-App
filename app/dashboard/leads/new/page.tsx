import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AddLeadForm } from "@/components/add-lead-form"

export default async function NewLeadPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Add New Lead</h1>
        <p className="text-muted-foreground mt-2">Enter the contact information for your new lead.</p>
      </div>

      <AddLeadForm />
    </div>
  )
}
