"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Edit, Trash2, Target, Play, Pause } from "lucide-react"
import { useRouter } from "next/navigation"

interface Campaign {
  id: string
  name: string
  subject: string
  status: string
  total_leads: number
  sent_count: number
  opened_count: number
  replied_count: number
  created_at: string
  scheduled_at: string
}

interface CampaignsTableProps {
  campaigns: Campaign[]
}

export function CampaignsTable({ campaigns: initialCampaigns }: CampaignsTableProps) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState<string | null>(null)
  const [isPausing, setIsPausing] = useState<string | null>(null)
  const router = useRouter()

  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.subject?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async (campaignId: string) => {
    setIsDeleting(campaignId)
    const supabase = createClient()

    try {
      const { error: leadsError } = await supabase.from("campaign_leads").delete().eq("campaign_id", campaignId)

      if (leadsError) {
        console.error("Error deleting campaign leads:", leadsError)
        throw leadsError
      }

      // Then delete the campaign
      const { error: campaignError } = await supabase.from("campaigns").delete().eq("id", campaignId)

      if (campaignError) {
        console.error("Error deleting campaign:", campaignError)
        throw campaignError
      }

      setCampaigns(campaigns.filter((campaign) => campaign.id !== campaignId))
    } catch (error) {
      console.error("Delete operation failed:", error)
    } finally {
      setIsDeleting(null)
    }
  }

  const handleStart = async (campaignId: string) => {
    setIsStarting(campaignId)

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/start`, {
        method: "POST",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to start campaign")
      }

      // Update campaign status in local state
      setCampaigns(
        campaigns.map((campaign) =>
          campaign.id === campaignId
            ? { ...campaign, status: "active", sent_count: result.sentCount || campaign.sent_count }
            : campaign,
        ),
      )

      // Show success message (you could add a toast notification here)
      console.log("[v0] Campaign started successfully:", result.message)
    } catch (error) {
      console.error("Error starting campaign:", error)
      // Show error message (you could add a toast notification here)
    } finally {
      setIsStarting(null)
    }
  }

  const handlePause = async (campaignId: string) => {
    setIsPausing(campaignId)

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/pause`, {
        method: "POST",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to pause campaign")
      }

      // Update campaign status in local state
      setCampaigns(
        campaigns.map((campaign) => (campaign.id === campaignId ? { ...campaign, status: "paused" } : campaign)),
      )

      console.log("[v0] Campaign paused successfully")
    } catch (error) {
      console.error("Error pausing campaign:", error)
    } finally {
      setIsPausing(null)
    }
  }

  const getStatusBadge = (status: string) => {
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

  const calculateOpenRate = (opened: number, sent: number) => {
    if (sent === 0) return "0%"
    return `${Math.round((opened / sent) * 100)}%`
  }

  const calculateReplyRate = (replied: number, sent: number) => {
    if (sent === 0) return "0%"
    return `${Math.round((replied / sent) * 100)}%`
  }

  if (campaigns.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Target className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">No campaigns yet</h3>
              <p className="text-muted-foreground">Create your first email campaign to start reaching out to leads.</p>
            </div>
            <Button onClick={() => router.push("/dashboard/campaigns/new")}>Create Campaign</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground">All Campaigns ({campaigns.length})</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Open Rate</TableHead>
                <TableHead>Reply Rate</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground">{campaign.name}</div>
                      <div className="text-sm text-muted-foreground">{campaign.subject}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(campaign.status || "draft")}</TableCell>
                  <TableCell className="text-foreground">{campaign.total_leads || 0}</TableCell>
                  <TableCell className="text-foreground">{campaign.sent_count || 0}</TableCell>
                  <TableCell className="text-foreground">
                    {calculateOpenRate(campaign.opened_count || 0, campaign.sent_count || 0)}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {calculateReplyRate(campaign.replied_count || 0, campaign.sent_count || 0)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {campaign.status === "active" ? (
                          <DropdownMenuItem
                            onClick={() => handlePause(campaign.id)}
                            disabled={isPausing === campaign.id}
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            {isPausing === campaign.id ? "Pausing..." : "Pause"}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleStart(campaign.id)}
                            disabled={isStarting === campaign.id}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {isStarting === campaign.id ? "Starting..." : "Start"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(campaign.id)}
                          disabled={isDeleting === campaign.id}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {isDeleting === campaign.id ? "Deleting..." : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
