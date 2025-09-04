import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { timeRange, format } = await request.json()

    // Calculate date range
    const days = Number.parseInt(timeRange || "30")
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // Fetch analytics data
    const [leadsResult, campaignsResult, emailTrackingResult] = await Promise.all([
      supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", cutoffDate.toISOString())
        .order("created_at", { ascending: false }),

      supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", cutoffDate.toISOString())
        .order("created_at", { ascending: false }),

      supabase
        .from("email_tracking")
        .select(`
          *,
          leads!inner (
            user_id,
            contact_name,
            email,
            company_name
          ),
          campaigns (
            name
          )
        `)
        .eq("leads.user_id", user.id)
        .gte("sent_at", cutoffDate.toISOString())
        .order("sent_at", { ascending: false }),
    ])

    const leads = leadsResult.data || []
    const campaigns = campaignsResult.data || []
    const emailTracking = emailTrackingResult.data || []

    // Calculate metrics
    const totalLeads = leads.length
    const totalCampaigns = campaigns.length
    const totalEmailsSent = emailTracking.length
    const totalOpened = emailTracking.filter((e) => e.opened_at).length
    const totalClicked = emailTracking.filter((e) => e.clicked_at).length
    const totalReplied = emailTracking.filter((e) => e.replied_at).length

    const openRate = totalEmailsSent > 0 ? Math.round((totalOpened / totalEmailsSent) * 100) : 0
    const clickRate = totalEmailsSent > 0 ? Math.round((totalClicked / totalEmailsSent) * 100) : 0
    const replyRate = totalEmailsSent > 0 ? Math.round((totalReplied / totalEmailsSent) * 100) : 0

    if (format === "csv") {
      // Generate CSV data
      const csvData = [
        ["Metric", "Value"],
        ["Report Period", `Last ${days} days`],
        ["Total Leads", totalLeads.toString()],
        ["Total Campaigns", totalCampaigns.toString()],
        ["Emails Sent", totalEmailsSent.toString()],
        ["Emails Opened", totalOpened.toString()],
        ["Emails Clicked", totalClicked.toString()],
        ["Emails Replied", totalReplied.toString()],
        ["Open Rate", `${openRate}%`],
        ["Click Rate", `${clickRate}%`],
        ["Reply Rate", `${replyRate}%`],
        [""],
        ["Campaign Performance"],
        ["Campaign Name", "Sent", "Opened", "Replied", "Open Rate", "Reply Rate"],
        ...campaigns.map((campaign) => [
          campaign.name,
          (campaign.sent_count || 0).toString(),
          (campaign.opened_count || 0).toString(),
          (campaign.replied_count || 0).toString(),
          campaign.sent_count > 0 ? `${Math.round(((campaign.opened_count || 0) / campaign.sent_count) * 100)}%` : "0%",
          campaign.sent_count > 0
            ? `${Math.round(((campaign.replied_count || 0) / campaign.sent_count) * 100)}%`
            : "0%",
        ]),
      ]

      const csvContent = csvData.map((row) => row.join(",")).join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="analytics-report-${days}days.csv"`,
        },
      })
    }

    // Return JSON format
    const reportData = {
      period: `Last ${days} days`,
      generatedAt: new Date().toISOString(),
      summary: {
        totalLeads,
        totalCampaigns,
        totalEmailsSent,
        totalOpened,
        totalClicked,
        totalReplied,
        openRate,
        clickRate,
        replyRate,
      },
      campaigns: campaigns.map((campaign) => ({
        name: campaign.name,
        sent: campaign.sent_count || 0,
        opened: campaign.opened_count || 0,
        replied: campaign.replied_count || 0,
        openRate: campaign.sent_count > 0 ? Math.round(((campaign.opened_count || 0) / campaign.sent_count) * 100) : 0,
        replyRate:
          campaign.sent_count > 0 ? Math.round(((campaign.replied_count || 0) / campaign.sent_count) * 100) : 0,
      })),
      leads: leads.map((lead) => ({
        name: lead.contact_name,
        email: lead.email,
        company: lead.company_name,
        status: lead.status,
        source: lead.source,
        createdAt: lead.created_at,
      })),
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Failed to export analytics data" }, { status: 500 })
  }
}
