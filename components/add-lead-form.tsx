"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { EmailValidator, type EmailValidationResult } from "@/lib/email-validator"

export function AddLeadForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailValidation, setEmailValidation] = useState<EmailValidationResult | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    contact_name: "",
    email: "",
    company_name: "",
    title: "",
    phone: "",
    location: "",
    industry: "",
    company_website: "",
    linkedin_url: "",
    notes: "",
    status: "new",
    source: "manual",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const validation = EmailValidator.validateEmail(formData.email)
    if (!validation.isValid) {
      setError(
        `Invalid email: ${validation.reason}${validation.suggestion ? `. Did you mean: ${validation.suggestion}?` : ""}`,
      )
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("You must be logged in to add leads")
      setIsLoading(false)
      return
    }

    const { error: userError } = await supabase.from("users").upsert(
      {
        id: user.id,
        email: user.email,
        username: user.email?.split("@")[0] || "user",
        created_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    )

    if (userError) {
      console.log("[v0] User upsert error:", userError)
      // Continue anyway as the trigger should handle this
    }

    const { error: insertError } = await supabase.from("leads").insert({
      ...formData,
      user_id: user.id,
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      router.push("/dashboard/leads")
    }
    setIsLoading(false)
  }

  const handleEmailChange = (value: string) => {
    setFormData((prev) => ({ ...prev, email: value }))

    if (value) {
      const validation = EmailValidator.validateEmail(value)
      setEmailValidation(validation)
    } else {
      setEmailValidation(null)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === "email") {
      handleEmailChange(value)
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/leads">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Link>
        </Button>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Name *</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => handleInputChange("contact_name", e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="john@company.com"
                  required
                  className={emailValidation && !emailValidation.isValid ? "border-destructive" : ""}
                />
                {emailValidation && !emailValidation.isValid && (
                  <p className="text-sm text-destructive">
                    {emailValidation.reason}
                    {emailValidation.suggestion && (
                      <span className="block text-muted-foreground">Suggestion: {emailValidation.suggestion}</span>
                    )}
                  </p>
                )}
                {emailValidation && emailValidation.isValid && formData.email && (
                  <p className="text-sm text-green-600">✓ Valid email address</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange("company_name", e.target.value)}
                  placeholder="Acme Corp"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Marketing Director"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="San Francisco, CA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => handleInputChange("industry", e.target.value)}
                  placeholder="Technology"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="unqualified">Unqualified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_website">Company Website</Label>
              <Input
                id="company_website"
                type="url"
                value={formData.company_website}
                onChange={(e) => handleInputChange("company_website", e.target.value)}
                placeholder="https://company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
              <Input
                id="linkedin_url"
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => handleInputChange("linkedin_url", e.target.value)}
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes about this lead..."
                rows={3}
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding Lead..." : "Add Lead"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/leads">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
