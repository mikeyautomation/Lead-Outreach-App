export interface LeadData {
  first_name?: string
  last_name?: string
  email: string
  company?: string
  position?: string
  [key: string]: any
}

export function processEmailTemplate(html: string, leadData: LeadData): string {
  if (!html || typeof html !== "string") {
    return ""
  }

  let processedHtml = html

  // Replace common variables with lead data
  const replacements: Record<string, string> = {
    "{{first_name}}": leadData.first_name || "there",
    "{{last_name}}": leadData.last_name || "",
    "{{full_name}}": `${leadData.first_name || ""} ${leadData.last_name || ""}`.trim() || "there",
    "{{email}}": leadData.email || "",
    "{{company}}": leadData.company || "your company",
    "{{position}}": leadData.position || "",
  }

  // Apply replacements
  Object.entries(replacements).forEach(([placeholder, value]) => {
    processedHtml = processedHtml.replace(new RegExp(placeholder, "g"), value)
  })

  return processedHtml
}

export function addEmailTracking(html: string, trackingId: string, baseUrl: string): string {
  if (!html || typeof html !== "string") {
    return ""
  }

  let trackedHtml = html

  const trackingPixel = `<img src="${baseUrl}/api/track/open?id=${trackingId}" width="1" height="1" style="display:none;" alt="" />`

  // Insert tracking pixel before closing body tag, or at the end if no body tag
  if (trackedHtml.includes("</body>")) {
    trackedHtml = trackedHtml.replace("</body>", `${trackingPixel}</body>`)
  } else {
    trackedHtml += trackingPixel
  }

  const linkRegex = /<a\s+([^>]*href\s*=\s*["']([^"']+)["'][^>]*)>/gi

  trackedHtml = trackedHtml.replace(linkRegex, (match, attributes, originalUrl) => {
    // Skip if already a tracking URL
    if (originalUrl.includes("/api/track/click")) {
      return match
    }

    // Create tracking URL
    const encodedUrl = encodeURIComponent(originalUrl)
    const trackingUrl = `${baseUrl}/api/track/click?id=${trackingId}&url=${encodedUrl}`

    // Replace the href with tracking URL
    const newAttributes = attributes.replace(/href\s*=\s*["'][^"']+["']/i, `href="${trackingUrl}"`)

    return `<a ${newAttributes}>`
  })

  return trackedHtml
}

// Default sample variables for email preview
export const defaultSampleVariables = {
  first_name: "John",
  last_name: "Doe",
  email: "john.doe@example.com",
  company: "Acme Corp",
  position: "Marketing Manager",
}

export function generateEmailPreview(template: string, variables = defaultSampleVariables): string {
  return processEmailTemplate(template, variables)
}
