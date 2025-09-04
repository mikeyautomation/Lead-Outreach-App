import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const trackingId = searchParams.get("id")
  const url = searchParams.get("url")

  if (!trackingId || !url) {
    return new NextResponse("Missing tracking ID or URL", { status: 400 })
  }

  try {
    const supabase = await createClient()

    // Update email tracking record with clicked timestamp
    const { error } = await supabase
      .from("email_tracking")
      .update({ clicked_at: new Date().toISOString() })
      .eq("id", trackingId)
      .is("clicked_at", null) // Only update if not already clicked

    if (error) {
      console.error("Error tracking email click:", error)
    }

    // Redirect to the original URL
    return NextResponse.redirect(decodeURIComponent(url))
  } catch (error) {
    console.error("Error in click tracking:", error)
    return NextResponse.redirect(decodeURIComponent(url || "https://example.com"))
  }
}
