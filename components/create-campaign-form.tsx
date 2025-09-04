"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { EmailPreview } from "@/components/email-preview"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Users, Mail, Eye } from "lucide-react"
import Link from "next/link"

interface Lead {
  id: string
  contact_name: string
  email: string
  company_name: string
  status: string
}

interface CreateCampaignFormProps {
  leads: Lead[]
}

interface FollowUpEmail {
  id: string
  subject: string
  content: string
  delay_days: number
}

export function CreateCampaignForm({ leads }: CreateCampaignFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const router = useRouter()

  const [campaignData, setCampaignData] = useState({
    name: "",
    subject: "",
    email_content: "",
  })

  const [followUpEmails, setFollowUpEmails] = useState<FollowUpEmail[]>([])

  const filteredLeads = leads.filter(
    (lead) =>
      lead.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleLeadSelection = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId])
    } else {
      setSelectedLeads(selectedLeads.filter((id) => id !== leadId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map((lead) => lead.id))
    } else {
      setSelectedLeads([])
    }
  }

  const addFollowUpEmail = () => {
    const newEmail: FollowUpEmail = {
      id: Date.now().toString(),
      subject: "",
      content: "",
      delay_days: followUpEmails.length === 0 ? 3 : 7,
    }
    setFollowUpEmails([...followUpEmails, newEmail])
  }

  const updateFollowUpEmail = (id: string, field: keyof FollowUpEmail, value: string | number) => {
    setFollowUpEmails(followUpEmails.map((email) => (email.id === id ? { ...email, [field]: value } : email)))
  }

  const removeFollowUpEmail = (id: string) => {
    setFollowUpEmails(followUpEmails.filter((email) => email.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (selectedLeads.length === 0) {
      setError("Please select at least one lead for this campaign")
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("You must be logged in to create campaigns")
      setIsLoading(false)
      return
    }

    try {
      const { error: upsertError } = await supabase.from("users").upsert(
        {
          id: user.id,
          email: user.email,
          username: user.user_metadata?.username || user.email?.split("@")[0] || "user",
        },
        { onConflict: "id" },
      )

      if (upsertError) {
        console.error("Error upserting user:", upsertError)
      }

      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          ...campaignData,
          user_id: user.id,
          status: "draft",
          total_leads: selectedLeads.length,
          follow_up_sequence: followUpEmails.length > 0 ? followUpEmails : null,
        })
        .select()
        .single()

      if (campaignError) throw campaignError

      // Create campaign_leads relationships
      const campaignLeads = selectedLeads.map((leadId) => ({
        campaign_id: campaign.id,
        lead_id: leadId,
        status: "pending",
      }))

      const { error: leadsError } = await supabase.from("campaign_leads").insert(campaignLeads)

      if (leadsError) throw leadsError

      router.push("/dashboard/campaigns")
    } catch (err) {
      console.error("Campaign creation error:", err)
      setError(err instanceof Error ? err.message : "Failed to create campaign")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setCampaignData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/campaigns">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Campaign Details</TabsTrigger>
            <TabsTrigger value="leads">Select Leads ({selectedLeads.length})</TabsTrigger>
            <TabsTrigger value="followup">Follow-up Sequence</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Campaign Information</CardTitle>
                <CardDescription>Set up the basic details and email content for your campaign.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={campaignData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Q1 Product Launch Outreach"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject *</Label>
                  <Input
                    id="subject"
                    value={campaignData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    placeholder="Quick question about {{company_name}}'s marketing goals"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_content">Email Content *</Label>
                  <Textarea
                    id="email_content"
                    value={campaignData.email_content}
                    onChange={(e) => handleInputChange("email_content", e.target.value)}
                    placeholder="Hi {{contact_name}},&#10;&#10;I hope this email finds you well. I noticed that {{company_name}} is..."
                    rows={8}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Use variables like {`{{contact_name}}`}, {`{{company_name}}`}, {`{{title}}`} to personalize your
                    emails.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">Select Leads</CardTitle>
                    <CardDescription>Choose which leads to include in this campaign.</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    {selectedLeads.length} selected
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Input
                      placeholder="Search leads..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-md bg-muted/50">
                    <Checkbox
                      id="select-all"
                      checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor="select-all" className="text-sm font-medium text-foreground cursor-pointer">
                      Select all ({filteredLeads.length})
                    </Label>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-3 border border-border rounded-md p-2">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center space-x-4 p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={lead.id}
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => handleLeadSelection(lead.id, checked as boolean)}
                        className="border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground text-base">{lead.contact_name || "N/A"}</div>
                        <div className="text-sm text-muted-foreground mt-1">{lead.email}</div>
                        <div className="text-sm text-muted-foreground">{lead.company_name || "N/A"}</div>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        {lead.status}
                      </Badge>
                    </div>
                  ))}
                </div>

                {filteredLeads.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No leads found matching your search.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="followup" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Follow-up Sequence</CardTitle>
                    <CardDescription>Set up automated follow-up emails to increase response rates.</CardDescription>
                  </div>
                  <Button type="button" variant="outline" onClick={addFollowUpEmail}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Follow-up
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {followUpEmails.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No follow-up emails configured.</p>
                    <p className="text-sm text-muted-foreground">
                      Add follow-up emails to increase your response rate.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {followUpEmails.map((email, index) => (
                      <Card key={email.id} className="border-border">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">Follow-up #{index + 1}</CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFollowUpEmail(email.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label>Delay (days)</Label>
                              <Input
                                type="number"
                                min="1"
                                value={email.delay_days}
                                onChange={(e) =>
                                  updateFollowUpEmail(email.id, "delay_days", Number.parseInt(e.target.value) || 1)
                                }
                              />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <Label>Subject</Label>
                              <Input
                                value={email.subject}
                                onChange={(e) => updateFollowUpEmail(email.id, "subject", e.target.value)}
                                placeholder="Following up on my previous email"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Content</Label>
                            <Textarea
                              value={email.content}
                              onChange={(e) => updateFollowUpEmail(email.id, "content", e.target.value)}
                              placeholder="Hi {{contact_name}},&#10;&#10;I wanted to follow up on my previous email..."
                              rows={4}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            {campaignData.subject && campaignData.email_content ? (
              <EmailPreview subject={campaignData.subject} content={campaignData.email_content} />
            ) : (
              <Card className="border-border">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Eye className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Complete the campaign details to see a preview</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating Campaign..." : "Create Campaign"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/campaigns">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
