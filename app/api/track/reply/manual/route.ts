import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trackingId } = body

    if (!trackingId) {
      return NextResponse.json({ error: "Missing tracking ID" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update email tracking record with reply timestamp
    const { error } = await supabase
      .from("email_tracking")
      .update({
        replied_at: new Date().toISOString(),
      })
      .eq("id", trackingId)
      .is("replied_at", null) // Only update if not already replied

    if (error) {
      console.error("Error tracking manual reply:", error)
      return NextResponse.json({ error: "Failed to track reply" }, { status: 500 })
    }

    // Also update the campaign's replied count
    const { data: tracking } = await supabase.from("email_tracking").select("campaign_id").eq("id", trackingId).single()

    if (tracking?.campaign_id) {
      // Get current replied count and increment it
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("replied_count")
        .eq("id", tracking.campaign_id)
        .single()

      if (campaign) {
        await supabase
          .from("campaigns")
          .update({
            replied_count: (campaign.replied_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", tracking.campaign_id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in manual reply tracking:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
