import { Resend } from "resend"
import { addEmailTracking } from "./email-utils"

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailData {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail(emailData: EmailData, trackingId?: string) {
  try {
    console.log(`[v0] sendEmail called with:`)
    console.log(`[v0] - To: ${emailData.to}`)
    console.log(`[v0] - Subject: ${emailData.subject}`)
    console.log(`[v0] - From: ${emailData.from}`)
    console.log(`[v0] - Tracking ID: ${trackingId}`)
    console.log(`[v0] - RESEND_API_KEY exists: ${!!process.env.RESEND_API_KEY}`)

    if (process.env.RESEND_API_KEY) {
      console.log(`[v0] Attempting to send email to ${emailData.to} using Resend`)

      let finalHtml = emailData.html
      if (trackingId) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        console.log(`[v0] Adding tracking with base URL: ${baseUrl}`)
        finalHtml = addEmailTracking(emailData.html, trackingId, baseUrl)
        console.log(`[v0] Added tracking to email with ID: ${trackingId}`)
        console.log(`[v0] Tracking pixel URL: ${baseUrl}/api/track/open?id=${trackingId}`)
      }

      console.log(`[v0] Calling Resend API with:`)
      console.log(`[v0] - From: ${emailData.from || process.env.FROM_EMAIL || "onboarding@resend.dev"}`)
      console.log(`[v0] - To: [${emailData.to}]`)
      console.log(`[v0] - Subject: ${emailData.subject}`)
      console.log(`[v0] - HTML length: ${finalHtml.length} characters`)

      const { data, error } = await resend.emails.send({
        from: emailData.from || process.env.FROM_EMAIL || "onboarding@resend.dev",
        to: [emailData.to],
        subject: emailData.subject,
        html: finalHtml,
        tags: trackingId ? [{ name: "tracking_id", value: trackingId }] : undefined,
      })

      if (error) {
        console.error("[v0] Resend API error:", error)
        console.error("[v0] Error type:", typeof error)
        console.error("[v0] Error details:", JSON.stringify(error, null, 2))
        throw new Error(`Resend error: ${error.message || JSON.stringify(error)}`)
      }

      console.log(`[v0] Resend API response:`, data)
      console.log(`[v0] Email sent successfully via Resend! Message ID: ${data?.id}`)
      return { success: true, messageId: data?.id }
    } else {
      console.log(`[v0] RESEND_API_KEY not found, simulating email send to ${emailData.to}`)
      console.log(`[v0] Subject: ${emailData.subject}`)
      console.log(`[v0] This is a simulation - no real email was sent`)
      return { success: true, messageId: `sim_${Date.now()}` }
    }
  } catch (error) {
    console.error("[v0] Email sending failed with error:", error)
    console.error("[v0] Error type:", typeof error)
    console.error("[v0] Error message:", error instanceof Error ? error.message : "Unknown error")
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    throw error
  }
}
