import nodemailer from "nodemailer"
import { addEmailTracking, processEmailTemplate } from "./email-utils"

export interface GmailAccount {
  email: string
  appPassword: string
  dailyLimit: number
  sentToday: number
  lastResetDate: string
}

export interface EmailData {
  to: string
  subject: string
  html: string
  from?: string
  trackingId?: string
  leadData?: Record<string, string>
}

class GmailWorkspaceService {
  private accounts: GmailAccount[] = []
  private currentAccountIndex = 0

  constructor() {
    this.loadAccounts()
  }

  private loadAccounts() {
    const accountsData = process.env.GMAIL_WORKSPACE_ACCOUNTS
    if (!accountsData) {
      console.error("[v0] GMAIL_WORKSPACE_ACCOUNTS environment variable is not set")
      return
    }

    console.log("[v0] Raw GMAIL_WORKSPACE_ACCOUNTS value:", accountsData.substring(0, 100) + "...")

    try {
      let parsed: any
      try {
        parsed = JSON.parse(accountsData)
      } catch (parseError) {
        // Try normalizing single quotes to double quotes as fallback
        const normalizedJson = accountsData.replace(/'/g, '"')
        console.log("[v0] Attempting to parse with normalized quotes...")
        parsed = JSON.parse(normalizedJson)
      }

      if (!Array.isArray(parsed)) {
        throw new Error("GMAIL_WORKSPACE_ACCOUNTS must be a JSON array")
      }

      this.accounts = parsed.map((account: any, index: number) => {
        if (!account.email || !account.password) {
          throw new Error(`Account at index ${index} is missing required fields (email, password)`)
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(account.email)) {
          throw new Error(`Account at index ${index} has invalid email format: ${account.email}`)
        }

        return {
          email: account.email,
          appPassword: account.password,
          dailyLimit: account.dailyLimit || 2000,
          sentToday: 0,
          lastResetDate: new Date().toDateString(),
        }
      })

      console.log(`[v0] Successfully loaded ${this.accounts.length} Gmail Workspace accounts`)
      this.accounts.forEach((account, i) => {
        console.log(`[v0] Account ${i + 1}: ${account.email} (limit: ${account.dailyLimit})`)
      })
    } catch (error) {
      console.error("[v0] Failed to parse Gmail Workspace accounts:", error)
      console.error("[v0] Please check your GMAIL_WORKSPACE_ACCOUNTS environment variable format")
      console.error("[v0] Expected format: [{'email':'user@domain.com','password':'apppassword','dailyLimit':2000}]")
      console.error(
        '[v0] Or with double quotes: [{"email":"user@domain.com","password":"apppassword","dailyLimit":2000}]',
      )
    }
  }

  private resetDailyCountsIfNeeded() {
    const today = new Date().toDateString()
    this.accounts.forEach((account) => {
      if (account.lastResetDate !== today) {
        account.sentToday = 0
        account.lastResetDate = today
      }
    })
  }

  private getNextAvailableAccount(): GmailAccount | null {
    this.resetDailyCountsIfNeeded()

    const availableAccounts = this.accounts.filter((account) => account.sentToday < account.dailyLimit)

    if (availableAccounts.length === 0) {
      console.log("[v0] No Gmail accounts available - all have reached daily limits")
      return null
    }

    // Round-robin selection among available accounts
    const account = availableAccounts[this.currentAccountIndex % availableAccounts.length]
    this.currentAccountIndex = (this.currentAccountIndex + 1) % availableAccounts.length

    console.log(`[v0] Selected Gmail account: ${account.email} (${account.sentToday}/${account.dailyLimit} sent today)`)
    return account
  }

  async sendEmail(emailData: EmailData) {
    try {
      console.log(`[v0] Gmail Workspace sendEmail called for: ${emailData.to}`)

      const account = this.getNextAvailableAccount()
      if (!account) {
        throw new Error("No Gmail Workspace accounts available - all have reached daily limits")
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: account.email,
          pass: account.appPassword,
        },
      })

      let finalHtml = emailData.html

      if (emailData.leadData) {
        finalHtml = processEmailTemplate(finalHtml, emailData.leadData)
      }

      if (emailData.trackingId) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        finalHtml = addEmailTracking(finalHtml, emailData.trackingId, baseUrl)
        console.log(`[v0] Added tracking to email with ID: ${emailData.trackingId}`)
      }

      const mailOptions = {
        from: emailData.from || account.email,
        to: emailData.to,
        subject: emailData.subject,
        html: finalHtml,
      }

      console.log(`[v0] Sending email from ${account.email} to ${emailData.to}`)
      const result = await transporter.sendMail(mailOptions)

      account.sentToday++

      console.log(`[v0] Email sent successfully! Message ID: ${result.messageId}`)
      console.log(`[v0] Account ${account.email} usage: ${account.sentToday}/${account.dailyLimit}`)

      return {
        success: true,
        messageId: result.messageId,
        accountUsed: account.email,
        accountUsage: `${account.sentToday}/${account.dailyLimit}`,
      }
    } catch (error) {
      console.error("[v0] Gmail Workspace email sending failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  getAccountUsage() {
    this.resetDailyCountsIfNeeded()
    return this.accounts.map((account) => ({
      email: account.email,
      sentToday: account.sentToday,
      dailyLimit: account.dailyLimit,
      available: account.sentToday < account.dailyLimit,
    }))
  }
}

export const gmailWorkspaceService = new GmailWorkspaceService()
export const sendEmail = gmailWorkspaceService.sendEmail.bind(gmailWorkspaceService)

export { GmailWorkspaceService }
