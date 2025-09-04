"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { ArrowLeft, Trash2, Play, Pause, RefreshCw, UserPlus } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

interface Campaign {
  id: string
  name: string
  subject: string
  email_content: string
  status: string
  total_leads: number
  sent_count: number
  opened_count: number
  replied_count: number
  follow_up_sequence: any[]
  created_at: string
}

interface CampaignLead {
  id: string
  status: string
  sent_at: string
  opened_at: string
  replied_at: string
  leads: {
    id: string
    contact_name: string
    email: string
    company_name: string
    status: string
  }
}

interface EditCampaignFormProps {
  campaign: Campaign
  campaignLeads: CampaignLead[]
}

export function EditCampaignForm({ campaign, campaignLeads }: EditCampaignFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAddingLeads, setIsAddingLeads] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [availableLeads, setAvailableLeads] = useState<any[]>([])
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [selectedLeadsForResend, setSelectedLeadsForResend] = useState<string[]>([])
  const [showAddLeadsDialog, setShowAddLeadsDialog] = useState(false)
  const [showResendDialog, setShowResendDialog] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: campaign.name || "",
    subject: campaign.subject || "",
    email_content: campaign.email_content || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: updateError } = await supabase.from("campaigns").update(formData).eq("id", campaign.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      router.push("/dashboard/campaigns")
    }
    setIsLoading(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()

    const { error: deleteError } = await supabase.from("campaigns").delete().eq("id", campaign.id)

    if (deleteError) {
      setError(deleteError.message)
      setIsDeleting(false)
    } else {
      router.push("/dashboard/campaigns")
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const },
      sent: { label: "Sent", variant: "default" as const },
      opened: { label: "Opened", variant: "default" as const },
      replied: { label: "Replied", variant: "default" as const },
      bounced: { label: "Bounced", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getCampaignStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", variant: "secondary" as const },
      scheduled: { label: "Scheduled", variant: "default" as const },
      active: { label: "Active", variant: "default" as const },
      paused: { label: "Paused", variant: "secondary" as const },
      completed: { label: "Completed", variant: "default" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const fetchAvailableLeads = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const campaignLeadIds = campaignLeads.map((cl) => cl.leads.id)

    const { data: leads, error } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .not("id", "in", `(${campaignLeadIds.join(",") || "''"})`)

    if (!error && leads) {
      setAvailableLeads(leads)
    }
  }

  const handleAddLeads = async () => {
    if (selectedLeads.length === 0) return

    setIsAddingLeads(true)
    const supabase = createClient()

    const campaignLeadInserts = selectedLeads.map((leadId) => ({
      campaign_id: campaign.id,
      lead_id: leadId,
      status: "pending",
    }))

    const { error } = await supabase.from("campaign_leads").insert(campaignLeadInserts)

    if (error) {
      setError(error.message)
      setIsAddingLeads(false)
      return
    }

    if (campaign.status === "active") {
      try {
        const response = await fetch(`/api/campaigns/${campaign.id}/send-to-new-leads`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            leadIds: selectedLeads,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          setError(`Leads added but failed to send emails: ${errorData.error}`)
        }
      } catch (err) {
        setError(`Leads added but failed to send emails: ${err instanceof Error ? err.message : "Unknown error"}`)
      }
    }

    setShowAddLeadsDialog(false)
    setSelectedLeads([])
    router.refresh()
    setIsAddingLeads(false)
  }

  const handleResendEmails = async () => {
    if (selectedLeadsForResend.length === 0) return

    setIsResending(true)

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/resend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadIds: selectedLeadsForResend,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to resend emails")
      }

      setShowResendDialog(false)
      setSelectedLeadsForResend([])
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend emails")
    }
    setIsResending(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/campaigns">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Link>
        </Button>

        <div className="flex gap-3">
          {campaign.status === "active" ? (
            <Button variant="outline" size="sm">
              <Pause className="h-4 w-4 mr-2" />
              Pause Campaign
            </Button>
          ) : (
            <Button variant="outline" size="sm">
              <Play className="h-4 w-4 mr-2" />
              Start Campaign
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete Campaign"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this campaign? This action cannot be undone and will remove all
                  associated data and tracking information.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete Campaign
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Campaign Details</TabsTrigger>
          <TabsTrigger value="leads">Leads ({campaignLeads.length})</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Campaign Information</CardTitle>
                  <CardDescription>Update the basic details and email content for your campaign.</CardDescription>
                </div>
                {getCampaignStatusBadge(campaign.status)}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Q1 Product Launch Outreach"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    placeholder="Quick question about your marketing goals"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_content">Email Content *</Label>
                  <Textarea
                    id="email_content"
                    value={formData.email_content}
                    onChange={(e) => handleInputChange("email_content", e.target.value)}
                    placeholder="Hi {{contact_name}},&#10;&#10;I hope this email finds you well..."
                    rows={8}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Use variables like {`{{contact_name}}`} and {`{{company_name}}`} to personalize your emails.
                  </p>
                </div>

                {error && (
                  <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Updating Campaign..." : "Update Campaign"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/dashboard/campaigns">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Campaign Leads</CardTitle>
                  <CardDescription>View and manage leads in this campaign.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={showAddLeadsDialog} onOpenChange={setShowAddLeadsDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={fetchAvailableLeads}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Leads
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add Leads to Campaign</DialogTitle>
                        <DialogDescription>
                          Select leads to add to this campaign. Only leads not already in the campaign are shown.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="max-h-96 overflow-y-auto">
                        {availableLeads.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">
                            No available leads to add. All your leads are already in this campaign.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {availableLeads.map((lead) => (
                              <div
                                key={lead.id}
                                className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center">
                                  <Checkbox
                                    id={lead.id}
                                    checked={selectedLeads.includes(lead.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedLeads([...selectedLeads, lead.id])
                                      } else {
                                        setSelectedLeads(selectedLeads.filter((id) => id !== lead.id))
                                      }
                                    }}
                                    className="h-5 w-5 border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                  />
                                </div>
                                <label htmlFor={lead.id} className="flex-1 cursor-pointer">
                                  <div className="font-medium text-foreground">{lead.contact_name}</div>
                                  <div className="text-sm text-muted-foreground">{lead.email}</div>
                                  <div className="text-sm text-muted-foreground">{lead.company_name}</div>
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddLeadsDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddLeads} disabled={selectedLeads.length === 0 || isAddingLeads}>
                          {isAddingLeads
                            ? "Adding..."
                            : `Add ${selectedLeads.length} Lead${selectedLeads.length !== 1 ? "s" : ""}`}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showResendDialog} onOpenChange={setShowResendDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Resend Emails
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Resend Emails</DialogTitle>
                        <DialogDescription>
                          Select leads to resend emails to. This will send the campaign email again to the selected
                          leads.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="max-h-96 overflow-y-auto">
                        <div className="space-y-2">
                          {campaignLeads.map((campaignLead) => (
                            <div
                              key={campaignLead.id}
                              className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center">
                                <Checkbox
                                  id={campaignLead.id}
                                  checked={selectedLeadsForResend.includes(campaignLead.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedLeadsForResend([...selectedLeadsForResend, campaignLead.id])
                                    } else {
                                      setSelectedLeadsForResend(
                                        selectedLeadsForResend.filter((id) => id !== campaignLead.id),
                                      )
                                    }
                                  }}
                                  className="h-5 w-5 border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                />
                              </div>
                              <label htmlFor={campaignLead.id} className="flex-1 cursor-pointer">
                                <div className="font-medium text-foreground">
                                  {campaignLead.leads.contact_name || "N/A"}
                                </div>
                                <div className="text-sm text-muted-foreground">{campaignLead.leads.email}</div>
                                <div className="text-sm text-muted-foreground">{campaignLead.leads.company_name}</div>
                                <div className="flex gap-2 mt-2">
                                  {getStatusBadge(campaignLead.status)}
                                  {campaignLead.sent_at && (
                                    <span className="text-xs text-muted-foreground">
                                      Sent: {new Date(campaignLead.sent_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowResendDialog(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleResendEmails}
                          disabled={selectedLeadsForResend.length === 0 || isResending}
                        >
                          {isResending
                            ? "Resending..."
                            : `Resend to ${selectedLeadsForResend.length} Lead${selectedLeadsForResend.length !== 1 ? "s" : ""}`}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Opened</TableHead>
                      <TableHead>Replied</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignLeads.map((campaignLead) => (
                      <TableRow key={campaignLead.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">
                              {campaignLead.leads.contact_name || "N/A"}
                            </div>
                            <div className="text-sm text-muted-foreground">{campaignLead.leads.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">{campaignLead.leads.company_name || "N/A"}</TableCell>
                        <TableCell>{getStatusBadge(campaignLead.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {campaignLead.sent_at ? new Date(campaignLead.sent_at).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {campaignLead.opened_at ? new Date(campaignLead.opened_at).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {campaignLead.replied_at ? new Date(campaignLead.replied_at).toLocaleDateString() : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{campaign.total_leads || 0}</div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Emails Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{campaign.sent_count || 0}</div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Open Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {campaign.sent_count > 0
                    ? `${Math.round(((campaign.opened_count || 0) / campaign.sent_count) * 100)}%`
                    : "0%"}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Reply Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {campaign.sent_count > 0
                    ? `${Math.round(((campaign.replied_count || 0) / campaign.sent_count) * 100)}%`
                    : "0%"}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
