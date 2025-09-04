import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GmailWorkspaceService } from "@/lib/gmail-workspace-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] Starting campaign with ID:", params.id)
    console.log("[v0] Environment variables check:")
    console.log("[v0] - GMAIL_WORKSPACE_ACCOUNTS:", process.env.GMAIL_WORKSPACE_ACCOUNTS ? "✓ Set" : "✗ Missing")
    console.log("[v0] - NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL ? "✓ Set" : "✗ Missing")

    const supabase = await createClient()
    const campaignId = params.id
    const gmailService = new GmailWorkspaceService()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log("[v0] Authentication failed:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("[v0] User authenticated:", user.id)

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .eq("user_id", user.id)
      .single()

    if (campaignError || !campaign) {
      console.log("[v0] Campaign not found:", campaignError)
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }
    console.log("[v0] Campaign found:", campaign.name, "Status:", campaign.status)

    // Get campaign leads
    const { data: campaignLeads, error: leadsError } = await supabase
      .from("campaign_leads")
      .select(`
        lead_id,
        leads (
          id,
          first_name,
          last_name,
          email,
          company,
          position
        )
      `)
      .eq("campaign_id", campaignId)

    if (leadsError) {
      console.log("[v0] Failed to fetch leads:", leadsError)
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
    }
    console.log("[v0] Found", campaignLeads.length, "leads for campaign")

    try {
      console.log("[v0] Starting email sending through Gmail Workspace accounts...")

      let sentCount = 0
      const trackingPromises = []

      for (const campaignLead of campaignLeads) {
        const lead = campaignLead.leads
        if (!lead?.email) continue

        try {
          // Create tracking record first
          const { data: trackingRecord } = await supabase
            .from("email_tracking")
            .insert({
              campaign_id: campaignId,
              lead_id: lead.id,
              email_type: "initial",
              sent_at: new Date().toISOString(),
              subject: campaign.subject,
              content: campaign.email_content,
            })
            .select()
            .single()

          // Send email through Gmail Workspace
          const result = await gmailService.sendEmail({
            to: lead.email,
            subject: campaign.subject,
            html: campaign.email_content,
            trackingId: trackingRecord?.id || `${campaignId}_${lead.id}`,
            leadData: {
              first_name: lead.first_name || "",
              last_name: lead.last_name || "",
              company: lead.company || "",
              position: lead.position || "",
            },
          })

          if (result.success) {
            sentCount++
            console.log(`[v0] Email sent to ${lead.email} via account ${result.accountUsed}`)

            if (trackingRecord?.id && result.accountUsed) {
              await supabase
                .from("email_tracking")
                .update({ sender_email: result.accountUsed })
                .eq("id", trackingRecord.id)
            }
          } else {
            console.log(`[v0] Failed to send email to ${lead.email}:`, result.error)
          }
        } catch (emailError) {
          console.error(`[v0] Error sending email to ${lead.email}:`, emailError)
        }
      }

      const { error: updateError } = await supabase
        .from("campaigns")
        .update({
          status: "active",
          sent_count: sentCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaignId)

      if (updateError) {
        console.log("[v0] Failed to update campaign:", updateError)
        return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 })
      }

      console.log(`[v0] Campaign completed! Sent ${sentCount} emails through Gmail Workspace`)
      return NextResponse.json({
        success: true,
        message: `Campaign started! Sent ${sentCount} emails through Gmail Workspace accounts.`,
        sentCount,
        accountsUsed: gmailService.getAccountUsage(),
      })
    } catch (gmailError) {
      console.error("[v0] Gmail Workspace error:", gmailError)
      return NextResponse.json(
        {
          error: "Failed to send emails through Gmail Workspace",
          details: gmailError instanceof Error ? gmailError.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] Error starting campaign:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
