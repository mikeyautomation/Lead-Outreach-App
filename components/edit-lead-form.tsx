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
import { ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Lead {
  id: string
  contact_name: string
  email: string
  company_name: string
  title: string
  phone: string
  location: string
  industry: string
  company_website: string
  linkedin_url: string
  notes: string
  status: string
  source: string
}

interface EditLeadFormProps {
  lead: Lead
}

export function EditLeadForm({ lead }: EditLeadFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    contact_name: lead.contact_name || "",
    email: lead.email || "",
    company_name: lead.company_name || "",
    title: lead.title || "",
    phone: lead.phone || "",
    location: lead.location || "",
    industry: lead.industry || "",
    company_website: lead.company_website || "",
    linkedin_url: lead.linkedin_url || "",
    notes: lead.notes || "",
    status: lead.status || "new",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: updateError } = await supabase.from("leads").update(formData).eq("id", lead.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      router.push("/dashboard/leads")
    }
    setIsLoading(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()

    const { error: deleteError } = await supabase.from("leads").delete().eq("id", lead.id)

    if (deleteError) {
      setError(deleteError.message)
      setIsDeleting(false)
    } else {
      router.push("/dashboard/leads")
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/leads">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Link>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isDeleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete Lead"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Lead</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this lead? This action cannot be undone and will remove all associated
                campaign data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete Lead
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
                />
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
                {isLoading ? "Updating Lead..." : "Update Lead"}
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
