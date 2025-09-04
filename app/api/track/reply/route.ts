import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trackingId, replyContent } = body

    if (!trackingId) {
      return NextResponse.json({ error: "Missing tracking ID" }, { status: 400 })
    }

    const supabase = await createClient()

    // Update email tracking record with reply timestamp
    const { error } = await supabase
      .from("email_tracking")
      .update({
        replied_at: new Date().toISOString(),
        // You could store reply content if needed
      })
      .eq("id", trackingId)
      .is("replied_at", null) // Only update if not already replied

    if (error) {
      console.error("Error tracking email reply:", error)
      return NextResponse.json({ error: "Failed to track reply" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in reply tracking:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
