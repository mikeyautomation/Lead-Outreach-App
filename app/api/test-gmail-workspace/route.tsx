import { type NextRequest, NextResponse } from "next/server"
import { GmailWorkspaceService } from "@/lib/gmail-workspace-service"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Testing Gmail Workspace configuration...")

    const gmailService = new GmailWorkspaceService()

    // Test sending a simple email
    const result = await gmailService.sendEmail({
      to: "mike@scaledbyautomations.com", // Send test email to yourself
      subject: "Test Email from Lead Outreach App",
      html: `
        <h2>Gmail Workspace Test Email</h2>
        <p>This is a test email to verify your Gmail Workspace integration is working correctly.</p>
        <p>If you received this email, your setup is successful!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
      trackingId: `test_${Date.now()}`,
      leadData: {
        first_name: "Test",
        last_name: "User",
        company: "Test Company",
        position: "Test Position",
      },
    })

    const accountUsage = gmailService.getAccountUsage()

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Test email sent successfully via ${result.accountUsed}!`
        : `Failed to send test email: ${result.error}`,
      accountUsage,
      testDetails: {
        to: "mike@scaledbyautomations.com",
        subject: "Test Email from Lead Outreach App",
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Gmail Workspace test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test Gmail Workspace",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
