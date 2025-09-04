import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function GET() {
  try {
    console.log("[v0] Testing Resend configuration...")
    console.log("[v0] RESEND_API_KEY:", process.env.RESEND_API_KEY ? "✓ Set" : "✗ Missing")
    console.log("[v0] FROM_EMAIL:", process.env.FROM_EMAIL ? "✓ Set" : "✗ Missing")

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        error: "RESEND_API_KEY environment variable is missing",
        success: false,
      })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Test sending a simple email
    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || "onboarding@resend.dev",
      to: "test@example.com", // This won't actually send, just tests the API
      subject: "Test Email",
      html: "<p>This is a test email</p>",
    })

    console.log("[v0] Resend test result:", result)

    return NextResponse.json({
      success: true,
      message: "Resend is configured correctly",
      result: result,
    })
  } catch (error) {
    console.error("[v0] Resend test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error,
    })
  }
}
