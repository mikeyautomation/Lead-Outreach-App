import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CSVImportForm } from "@/components/csv-import-form"

export default async function ImportLeadsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Import Leads</h1>
        <p className="text-muted-foreground mt-2">Upload a CSV file to bulk import your leads.</p>
      </div>

      <CSVImportForm />
    </div>
  )
}
