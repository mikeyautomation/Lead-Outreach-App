export interface LeadData {
  first_name?: string
  last_name?: string
  email: string
  company?: string
  position?: string
  [key: string]: any
}

/**
 * Process email template by replacing variables with lead data
 */
export function processEmailTemplate(template: string, leadData: LeadData): string {
  if (!template || typeof template !== "string") {
    return ""
  }

  let processedTemplate = template

  // Replace common variables
  const variables = {
    "{{first_name}}": leadData.first_name || "there",
    "{{last_name}}": leadData.last_name || "",
    "{{full_name}}": `${leadData.first_name || ""} ${leadData.last_name || ""}`.trim() || "there",
    "{{email}}": leadData.email || "",
    "{{company}}": leadData.company || "your company",
    "{{position}}": leadData.position || "",
  }

  // Replace all variables in the template
  Object.entries(variables).forEach(([placeholder, value]) => {
    processedTemplate = processedTemplate.replace(new RegExp(placeholder, "g"), value)
  })

  return processedTemplate
}

/**
 * Add click tracking to all links in email content
 */
export function addClickTracking(emailContent: string, trackingId: string, baseUrl: string): string {
  if (!emailContent || typeof emailContent !== "string") {
    return emailContent || ""
  }

  if (!trackingId || !baseUrl) {
    return emailContent
  }

  // Regular expression to find all links in the email content
  const linkRegex = /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi

  return emailContent.replace(linkRegex, (match, beforeHref, originalUrl, afterHref) => {
    // Skip if already a tracking link
    if (originalUrl.includes("/api/track/click")) {
      return match
    }

    // Create tracking URL
    const trackingUrl = `${baseUrl}/api/track/click?id=${encodeURIComponent(trackingId)}&url=${encodeURIComponent(originalUrl)}`

    // Return the modified link with tracking URL
    return `<a ${beforeHref}href="${trackingUrl}"${afterHref}>`
  })
}

/**
 * Generate a unique tracking ID
 */
export function generateTrackingId(): string {
  return `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Extract all links from email content for preview purposes
 */
export function extractLinks(emailContent: string): string[] {
  if (!emailContent || typeof emailContent !== "string") {
    return []
  }

  const linkRegex = /<a\s+[^>]*?href=["']([^"']+)["'][^>]*?>/gi
  const links: string[] = []
  let match

  while ((match = linkRegex.exec(emailContent)) !== null) {
    links.push(match[1])
  }

  return links
}

/**
 * Generate email preview with sample data
 */
export function generateEmailPreview(template: string, sampleData?: LeadData): string {
  const defaultData: LeadData = {
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    company: "Acme Corp",
    position: "Marketing Director",
  }

  const leadData = sampleData || defaultData
  return processEmailTemplate(template, leadData)
}

/**
 * Default sample variables for email preview
 */
export const defaultSampleVariables: LeadData = {
  first_name: "John",
  last_name: "Doe",
  email: "john.doe@example.com",
  company: "Acme Corp",
  position: "Marketing Director",
}

/**
 * Add email tracking (click tracking only, no pixels)
 * This is an alias for addClickTracking to maintain compatibility
 */
export function addEmailTracking(emailContent: string, trackingId: string, baseUrl: string): string {
  return addClickTracking(emailContent, trackingId, baseUrl)
}
