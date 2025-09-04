export interface EmailValidationResult {
  isValid: boolean
  reason?: string
  suggestion?: string
}

export class EmailValidator {
  private static readonly COMMON_DOMAINS = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "aol.com",
    "icloud.com",
    "protonmail.com",
    "zoho.com",
    "mail.com",
  ]

  private static readonly BUSINESS_DOMAINS = ["company.com", "corp.com", "inc.com", "ltd.com", "llc.com"]

  private static readonly DISPOSABLE_DOMAINS = [
    "10minutemail.com",
    "tempmail.org",
    "guerrillamail.com",
    "mailinator.com",
    "throwaway.email",
    "temp-mail.org",
    "getnada.com",
    "maildrop.cc",
  ]

  static validateEmail(email: string): EmailValidationResult {
    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        reason: "Invalid email format",
      }
    }

    const [localPart, domain] = email.toLowerCase().split("@")

    // Check for disposable email domains
    if (this.DISPOSABLE_DOMAINS.includes(domain)) {
      return {
        isValid: false,
        reason: "Disposable email addresses are not allowed",
      }
    }

    // Check for common typos in popular domains
    const suggestion = this.suggestDomainCorrection(domain)
    if (suggestion && suggestion !== domain) {
      return {
        isValid: false,
        reason: "Possible typo in domain",
        suggestion: `${localPart}@${suggestion}`,
      }
    }

    // Check local part length
    if (localPart.length > 64) {
      return {
        isValid: false,
        reason: "Email local part too long",
      }
    }

    // Check for consecutive dots
    if (localPart.includes("..") || domain.includes("..")) {
      return {
        isValid: false,
        reason: "Consecutive dots not allowed",
      }
    }

    // Check for valid characters in local part
    const validLocalRegex = /^[a-zA-Z0-9._+-]+$/
    if (!validLocalRegex.test(localPart)) {
      return {
        isValid: false,
        reason: "Invalid characters in email",
      }
    }

    return { isValid: true }
  }

  private static suggestDomainCorrection(domain: string): string | null {
    const suggestions: { [key: string]: string } = {
      "gmial.com": "gmail.com",
      "gmai.com": "gmail.com",
      "gmail.co": "gmail.com",
      "yahooo.com": "yahoo.com",
      "yaho.com": "yahoo.com",
      "hotmial.com": "hotmail.com",
      "hotmai.com": "hotmail.com",
      "outlok.com": "outlook.com",
      "outloo.com": "outlook.com",
    }

    return suggestions[domain] || null
  }

  static async validateEmailAdvanced(email: string): Promise<EmailValidationResult> {
    // First run basic validation
    const basicResult = this.validateEmail(email)
    if (!basicResult.isValid) {
      return basicResult
    }

    // For now, return basic validation
    // In the future, you could add DNS MX record checking here
    return basicResult
  }
}
