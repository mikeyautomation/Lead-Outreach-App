"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Mail,
  Eye,
  MousePointer,
  Reply,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  ArrowUpDown,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface EmailTracking {
  id: string
  email_type: string
  subject: string
  content: string
  sent_at: string
  opened_at: string | null
  clicked_at: string | null
  replied_at: string | null
  bounced_at: string | null
  sender_email?: string | null // Added sender_email field to track which Gmail account sent the email
  leads: {
    id: string
    contact_name: string
    email: string
    company_name: string
  }
  campaigns: {
    id: string
    name: string
  }
}

interface Campaign {
  id: string
  name: string
  sent_count: number
  opened_count: number
  replied_count: number
  total_leads: number
}

interface EmailTrackingDashboardProps {
  emailTracking: EmailTracking[]
  campaigns: Campaign[]
}

export function EmailTrackingDashboard({ emailTracking, campaigns }: EmailTrackingDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedSender, setSelectedSender] = useState<string>("all") // Added sender email filter state
  const [sortBy, setSortBy] = useState<string>("sent_at") // Added sorting state
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc") // Added sort order state
  const [markingReply, setMarkingReply] = useState<string | null>(null)
  const router = useRouter()

  const uniqueSenders = Array.from(new Set(emailTracking.map((email) => email.sender_email).filter(Boolean)))

  const totalSent = emailTracking.length
  const totalOpened = emailTracking.filter((email) => email.opened_at).length
  const totalClicked = emailTracking.filter((email) => email.clicked_at).length
  const totalReplied = emailTracking.filter((email) => email.replied_at).length
  const totalBounced = emailTracking.filter((email) => email.bounced_at).length

  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0
  const clickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0
  const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0
  const bounceRate = totalSent > 0 ? Math.round((totalBounced / totalSent) * 100) : 0

  const filteredEmails = emailTracking
    .filter((email) => {
      const matchesSearch =
        email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.leads?.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.leads?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.campaigns?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.sender_email?.toLowerCase().includes(searchTerm.toLowerCase()) // Added sender email to search

      const matchesCampaign = selectedCampaign === "all" || email.campaigns?.id === selectedCampaign

      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "sent" && email.sent_at && !email.opened_at) ||
        (selectedStatus === "opened" && email.opened_at && !email.clicked_at && !email.replied_at) ||
        (selectedStatus === "clicked" && email.clicked_at && !email.replied_at) ||
        (selectedStatus === "replied" && email.replied_at) ||
        (selectedStatus === "bounced" && email.bounced_at)

      const matchesSender = selectedSender === "all" || email.sender_email === selectedSender

      return matchesSearch && matchesCampaign && matchesStatus && matchesSender
    })
    .sort((a, b) => {
      // Added sorting functionality
      let aValue: any, bValue: any

      switch (sortBy) {
        case "sender_email":
          aValue = a.sender_email || ""
          bValue = b.sender_email || ""
          break
        case "recipient":
          aValue = a.leads?.contact_name || ""
          bValue = b.leads?.contact_name || ""
          break
        case "campaign":
          aValue = a.campaigns?.name || ""
          bValue = b.campaigns?.name || ""
          break
        case "subject":
          aValue = a.subject || ""
          bValue = b.subject || ""
          break
        case "sent_at":
        default:
          aValue = new Date(a.sent_at || 0)
          bValue = new Date(b.sent_at || 0)
          break
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const getEmailStatus = (email: EmailTracking) => {
    if (email.bounced_at) return { label: "Bounced", variant: "destructive" as const }
    if (email.replied_at) return { label: "Replied", variant: "default" as const }
    if (email.clicked_at) return { label: "Clicked", variant: "default" as const }
    if (email.opened_at) return { label: "Opened", variant: "default" as const }
    if (email.sent_at) return { label: "Sent", variant: "secondary" as const }
    return { label: "Pending", variant: "secondary" as const }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString()
  }

  const stats = [
    {
      title: "Total Sent",
      value: totalSent.toString(),
      description: "Emails delivered",
      icon: Mail,
      color: "text-primary",
    },
    {
      title: "Open Rate",
      value: `${openRate}%`,
      description: `${totalOpened} opened`,
      icon: Eye,
      color: openRate >= 20 ? "text-primary" : "text-muted-foreground",
      trend: openRate >= 20 ? TrendingUp : TrendingDown,
    },
    {
      title: "Click Rate",
      value: `${clickRate}%`,
      description: `${totalClicked} clicked`,
      icon: MousePointer,
      color: clickRate >= 3 ? "text-primary" : "text-muted-foreground",
      trend: clickRate >= 3 ? TrendingUp : TrendingDown,
    },
    {
      title: "Reply Rate",
      value: `${replyRate}%`,
      description: `${totalReplied} replied`,
      icon: Reply,
      color: replyRate >= 5 ? "text-primary" : "text-muted-foreground",
      trend: replyRate >= 5 ? TrendingUp : TrendingDown,
    },
  ]

  const handleMarkAsReplied = async (trackingId: string) => {
    setMarkingReply(trackingId)
    try {
      const response = await fetch("/api/track/reply/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trackingId }),
      })

      if (response.ok) {
        router.refresh()
      } else {
        console.error("Failed to mark email as replied")
      }
    } catch (error) {
      console.error("Error marking email as replied:", error)
    } finally {
      setMarkingReply(null)
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className="flex items-center gap-1">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                {stat.trend && <stat.trend className={`h-3 w-3 ${stat.color}`} />}
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="emails" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="emails">Email Activity</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="emails" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Email Activity</CardTitle>
                  <CardDescription>Track individual email performance and engagement</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search emails..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="All campaigns" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All campaigns</SelectItem>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedSender} onValueChange={setSelectedSender}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="All senders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All senders</SelectItem>
                      {uniqueSenders.map((sender) => (
                        <SelectItem key={sender} value={sender}>
                          {sender}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="All status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All status</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="opened">Opened</SelectItem>
                      <SelectItem value="clicked">Clicked</SelectItem>
                      <SelectItem value="replied">Replied</SelectItem>
                      <SelectItem value="bounced">Bounced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                          onClick={() => handleSort("recipient")}
                        >
                          Recipient
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                          onClick={() => handleSort("sender_email")}
                        >
                          Sender
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                          onClick={() => handleSort("campaign")}
                        >
                          Campaign
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                          onClick={() => handleSort("subject")}
                        >
                          Subject
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                          onClick={() => handleSort("sent_at")}
                        >
                          Sent
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Opened</TableHead>
                      <TableHead>Replied</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmails.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="text-muted-foreground">
                            {emailTracking.length === 0 ? "No email activity yet" : "No emails match your filters"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmails.map((email) => {
                        const status = getEmailStatus(email)
                        return (
                          <TableRow key={email.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium text-foreground">{email.leads?.contact_name || "N/A"}</div>
                                <div className="text-sm text-muted-foreground">{email.leads?.email}</div>
                                <div className="text-sm text-muted-foreground">{email.leads?.company_name}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-foreground">{email.sender_email || "N/A"}</div>
                            </TableCell>
                            <TableCell className="text-foreground">{email.campaigns?.name || "N/A"}</TableCell>
                            <TableCell className="text-foreground max-w-xs truncate">{email.subject}</TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{formatDateTime(email.sent_at)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatDateTime(email.opened_at)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatDateTime(email.replied_at)}</TableCell>
                            <TableCell>
                              {!email.replied_at && email.sent_at ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkAsReplied(email.id)}
                                  disabled={markingReply === email.id}
                                  className="text-xs"
                                >
                                  {markingReply === email.id ? (
                                    "Marking..."
                                  ) : (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Mark as Replied
                                    </>
                                  )}
                                </Button>
                              ) : email.replied_at ? (
                                <Badge variant="default" className="text-xs">
                                  <Reply className="h-3 w-3 mr-1" />
                                  Replied
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Campaign Performance</CardTitle>
              <CardDescription>Compare performance metrics across all campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Total Leads</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Open Rate</TableHead>
                      <TableHead>Reply Rate</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="text-muted-foreground">No campaigns created yet</div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      campaigns.map((campaign) => {
                        const campaignOpenRate =
                          campaign.sent_count > 0 ? Math.round((campaign.opened_count / campaign.sent_count) * 100) : 0
                        const campaignReplyRate =
                          campaign.sent_count > 0 ? Math.round((campaign.replied_count / campaign.sent_count) * 100) : 0

                        const getPerformanceBadge = () => {
                          const avgScore = (campaignOpenRate + campaignReplyRate) / 2
                          if (avgScore >= 15) return { label: "Excellent", variant: "default" as const }
                          if (avgScore >= 10) return { label: "Good", variant: "secondary" as const }
                          if (avgScore >= 5) return { label: "Average", variant: "secondary" as const }
                          return { label: "Needs Improvement", variant: "destructive" as const }
                        }

                        const performance = getPerformanceBadge()

                        return (
                          <TableRow key={campaign.id}>
                            <TableCell className="font-medium text-foreground">{campaign.name}</TableCell>
                            <TableCell className="text-foreground">{campaign.total_leads || 0}</TableCell>
                            <TableCell className="text-foreground">{campaign.sent_count || 0}</TableCell>
                            <TableCell className="text-foreground">{campaignOpenRate}%</TableCell>
                            <TableCell className="text-foreground">{campaignReplyRate}%</TableCell>
                            <TableCell>
                              <Badge variant={performance.variant}>{performance.label}</Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
