import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GmailWorkspaceService } from "@/lib/gmail-workspace-service"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { leadIds } = await request.json()

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: "Lead IDs are required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Get campaign leads to resend to
    const { data: campaignLeads, error: leadsError } = await supabase
      .from("campaign_leads")
      .select(`
        *,
        leads (
          id,
          contact_name,
          email,
          company_name,
          job_title,
          phone,
          website,
          notes
        )
      `)
      .eq("campaign_id", id)
      .in("id", leadIds)

    if (leadsError || !campaignLeads) {
      return NextResponse.json({ error: "Failed to fetch campaign leads" }, { status: 500 })
    }

    const gmailService = new GmailWorkspaceService()
    let successCount = 0
    let errorCount = 0

    // Resend emails to selected leads
    for (const campaignLead of campaignLeads) {
      try {
        // Create new tracking record
        const { data: trackingRecord, error: trackingError } = await supabase
          .from("email_tracking")
          .insert({
            campaign_id: id,
            lead_id: campaignLead.leads.id,
            email: campaignLead.leads.email,
            subject: campaign.subject,
            sent_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (trackingError) {
          console.error(`[v0] Failed to create tracking record for lead ${campaignLead.leads.id}:`, trackingError)
          errorCount++
          continue
        }

        // Send email
        const emailResult = await gmailService.sendEmail({
          to: campaignLead.leads.email,
          subject: campaign.subject,
          content: campaign.email_content,
          leadData: {
            contact_name: campaignLead.leads.contact_name,
            email: campaignLead.leads.email,
            company_name: campaignLead.leads.company_name,
            job_title: campaignLead.leads.job_title,
            phone: campaignLead.leads.phone,
            website: campaignLead.leads.website,
            notes: campaignLead.leads.notes,
          },
          trackingId: trackingRecord.id,
        })

        if (emailResult.success) {
          // Update campaign lead status
          await supabase
            .from("campaign_leads")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", campaignLead.id)

          successCount++
        } else {
          console.error(`[v0] Failed to send email to ${campaignLead.leads.email}:`, emailResult.error)
          errorCount++
        }
      } catch (error) {
        console.error(`[v0] Error processing lead ${campaignLead.leads.id}:`, error)
        errorCount++
      }
    }

    // Update campaign sent count
    if (successCount > 0) {
      await supabase
        .from("campaigns")
        .update({
          sent_count: (campaign.sent_count || 0) + successCount,
        })
        .eq("id", id)
    }

    return NextResponse.json({
      success: true,
      message: `Resent emails to ${successCount} leads${errorCount > 0 ? ` (${errorCount} failed)` : ""}`,
      successCount,
      errorCount,
    })
  } catch (error) {
    console.error("[v0] Campaign resend error:", error)
    return NextResponse.json({ error: "Failed to resend emails" }, { status: 500 })
  }
}
