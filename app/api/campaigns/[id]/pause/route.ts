import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const campaignId = params.id

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update campaign status to paused
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({
        status: "paused",
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId)
      .eq("user_id", user.id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to pause campaign" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Campaign paused successfully",
    })
  } catch (error) {
    console.error("Error pausing campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
