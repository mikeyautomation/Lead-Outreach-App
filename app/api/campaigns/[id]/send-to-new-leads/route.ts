import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { GmailWorkspaceService } from "@/lib/gmail-workspace-service"
import { processEmailTemplate } from "@/lib/email-utils"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] Starting send-to-new-leads for campaign:", params.id)

    const { leadIds } = await request.json()

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: "No lead IDs provided" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log("[v0] Authentication failed:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (campaignError || !campaign) {
      console.log("[v0] Campaign not found:", campaignError)
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Get leads data
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .in("id", leadIds)
      .eq("user_id", user.id)

    if (leadsError || !leads || leads.length === 0) {
      console.log("[v0] Leads not found:", leadsError)
      return NextResponse.json({ error: "Leads not found" }, { status: 404 })
    }

    console.log("[v0] Found", leads.length, "leads to send emails to")

    // Initialize Gmail service
    const gmailService = new GmailWorkspaceService()
    let successCount = 0
    let failureCount = 0

    // Send emails to each lead
    for (const lead of leads) {
      try {
        console.log("[v0] Sending email to:", lead.email)

        // Create tracking record first
        const trackingId = `${campaign.id}_${lead.id}_${Date.now()}`

        const { error: trackingError } = await supabase.from("email_tracking").insert({
          id: trackingId,
          campaign_id: campaign.id,
          lead_id: lead.id,
          recipient_email: lead.email,
          subject: campaign.subject,
          sent_at: new Date().toISOString(),
        })

        if (trackingError) {
          console.log("[v0] Failed to create tracking record:", trackingError)
          failureCount++
          continue
        }

        // Process email template with lead data
        const processedContent = processEmailTemplate(campaign.email_content, {
          contact_name: lead.contact_name || lead.email,
          company_name: lead.company_name || "your company",
          email: lead.email,
        })

        const processedSubject = processEmailTemplate(campaign.subject, {
          contact_name: lead.contact_name || lead.email,
          company_name: lead.company_name || "your company",
          email: lead.email,
        })

        // Send email
        const emailResult = await gmailService.sendEmail({
          to: lead.email,
          subject: processedSubject,
          html: processedContent,
          trackingId: trackingId,
        })

        if (emailResult.success) {
          console.log("[v0] Email sent successfully to:", lead.email)

          // Update tracking record with sender email
          await supabase
            .from("email_tracking")
            .update({
              sender_email: emailResult.senderEmail,
              status: "sent",
            })
            .eq("id", trackingId)

          // Update campaign lead status
          await supabase
            .from("campaign_leads")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("campaign_id", campaign.id)
            .eq("lead_id", lead.id)

          successCount++
        } else {
          console.log("[v0] Failed to send email to:", lead.email, emailResult.error)

          // Update tracking record with error
          await supabase.from("email_tracking").update({ status: "failed" }).eq("id", trackingId)

          failureCount++
        }
      } catch (error) {
        console.log("[v0] Error sending email to:", lead.email, error)
        failureCount++
      }
    }

    // Update campaign sent count
    await supabase
      .from("campaigns")
      .update({
        sent_count: campaign.sent_count + successCount,
      })
      .eq("id", campaign.id)

    console.log("[v0] Email sending completed. Success:", successCount, "Failures:", failureCount)

    return NextResponse.json({
      success: true,
      message: `Emails sent to ${successCount} leads${failureCount > 0 ? `, ${failureCount} failed` : ""}`,
      successCount,
      failureCount,
    })
  } catch (error) {
    console.error("[v0] Error in send-to-new-leads:", error)
    return NextResponse.json({ error: "Failed to send emails to new leads" }, { status: 500 })
  }
}
