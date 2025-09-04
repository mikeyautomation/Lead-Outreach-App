import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const originalUrl = searchParams.get("url")
    const trackingId = searchParams.get("tracking_id")
    const campaignId = searchParams.get("campaign_id")

    console.log("[v0] Link click tracked:", { originalUrl, trackingId, campaignId })

    if (!originalUrl) {
      return NextResponse.redirect("https://example.com")
    }

    // Record the click if tracking ID is provided
    if (trackingId && campaignId) {
      const supabase = await createClient()

      // Get user agent and IP for analytics
      const userAgent = request.headers.get("user-agent") || ""
      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

      // Record link click in database
      const { error: linkError } = await supabase.from("link_tracking").insert({
        tracking_id: trackingId,
        campaign_id: campaignId,
        original_url: originalUrl,
        user_agent: userAgent,
        ip_address: ip,
        clicked_at: new Date().toISOString(),
      })

      if (linkError) {
        console.error("[v0] Error recording link click:", linkError)
      }

      // Update email tracking record
      const { error: emailError } = await supabase
        .from("email_tracking")
        .update({
          clicked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", trackingId)
        .is("clicked_at", null) // Only update if not already clicked

      if (emailError) {
        console.error("[v0] Error updating email tracking:", emailError)
      }

      // Update campaign click count
      const { error: campaignError } = await supabase.rpc("increment_campaign_clicks", {
        campaign_id: campaignId,
      })

      if (campaignError) {
        console.error("[v0] Error updating campaign clicks:", campaignError)
      }

      console.log("[v0] Link click recorded successfully")
    }

    // Redirect to original URL
    return NextResponse.redirect(originalUrl)
  } catch (error) {
    console.error("[v0] Error in link tracking:", error)
    // Fallback redirect
    return NextResponse.redirect("https://example.com")
  }
}
