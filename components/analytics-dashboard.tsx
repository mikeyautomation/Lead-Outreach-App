"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import {
  Users,
  Target,
  Mail,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  Reply,
  Download,
  Calendar,
} from "lucide-react"

interface Lead {
  id: string
  contact_name: string
  email: string
  company_name: string
  status: string
  source: string
  industry: string
  created_at: string
}

interface Campaign {
  id: string
  name: string
  status: string
  total_leads: number
  sent_count: number
  opened_count: number
  replied_count: number
  created_at: string
}

interface EmailTracking {
  id: string
  sent_at: string
  opened_at: string | null
  clicked_at: string | null
  replied_at: string | null
  bounced_at: string | null
}

interface CampaignLead {
  id: string
  status: string
  sent_at: string | null
  opened_at: string | null
  replied_at: string | null
}

interface AnalyticsDashboardProps {
  leads: Lead[]
  campaigns: Campaign[]
  emailTracking: EmailTracking[]
  campaignLeads: CampaignLead[]
}

export function AnalyticsDashboard({ leads, campaigns, emailTracking, campaignLeads }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState("30")
  const [isExporting, setIsExporting] = useState(false)

  const filteredData = useMemo(() => {
    const days = Number.parseInt(timeRange)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return {
      leads: leads.filter((lead) => new Date(lead.created_at) >= cutoffDate),
      campaigns: campaigns.filter((campaign) => new Date(campaign.created_at) >= cutoffDate),
      emailTracking: emailTracking.filter((email) => new Date(email.sent_at) >= cutoffDate),
      campaignLeads: campaignLeads.filter((cl) => !cl.sent_at || new Date(cl.sent_at) >= cutoffDate),
    }
  }, [leads, campaigns, emailTracking, campaignLeads, timeRange])

  const metrics = useMemo(() => {
    const totalLeads = filteredData.leads.length
    const totalCampaigns = filteredData.campaigns.length
    const totalEmailsSent = filteredData.emailTracking.length
    const totalOpened = filteredData.emailTracking.filter((e) => e.opened_at).length
    const totalClicked = filteredData.emailTracking.filter((e) => e.clicked_at).length
    const totalReplied = filteredData.emailTracking.filter((e) => e.replied_at).length

    const openRate = totalEmailsSent > 0 ? Math.round((totalOpened / totalEmailsSent) * 100) : 0
    const clickRate = totalEmailsSent > 0 ? Math.round((totalClicked / totalEmailsSent) * 100) : 0
    const replyRate = totalEmailsSent > 0 ? Math.round((totalReplied / totalEmailsSent) * 100) : 0

    const leadsByStatus = filteredData.leads.reduce(
      (acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const leadsBySource = filteredData.leads.reduce(
      (acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const leadsByIndustry = filteredData.leads.reduce(
      (acc, lead) => {
        const industry = lead.industry || "Unknown"
        acc[industry] = (acc[industry] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalLeads,
      totalCampaigns,
      totalEmailsSent,
      totalOpened,
      totalClicked,
      totalReplied,
      openRate,
      clickRate,
      replyRate,
      leadsByStatus,
      leadsBySource,
      leadsByIndustry,
    }
  }, [filteredData])

  const timeSeriesData = useMemo(() => {
    const days = Number.parseInt(timeRange)
    const data = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const leadsCreated = filteredData.leads.filter(
        (lead) => new Date(lead.created_at).toISOString().split("T")[0] === dateStr,
      ).length

      const emailsSent = filteredData.emailTracking.filter(
        (email) => new Date(email.sent_at).toISOString().split("T")[0] === dateStr,
      ).length

      const emailsOpened = filteredData.emailTracking.filter(
        (email) => email.opened_at && new Date(email.opened_at).toISOString().split("T")[0] === dateStr,
      ).length

      const emailsReplied = filteredData.emailTracking.filter(
        (email) => email.replied_at && new Date(email.replied_at).toISOString().split("T")[0] === dateStr,
      ).length

      data.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        leads: leadsCreated,
        sent: emailsSent,
        opened: emailsOpened,
        replied: emailsReplied,
      })
    }

    return data
  }, [filteredData, timeRange])

  const campaignPerformanceData = useMemo(() => {
    return filteredData.campaigns
      .map((campaign) => ({
        name: campaign.name.length > 20 ? campaign.name.substring(0, 20) + "..." : campaign.name,
        sent: campaign.sent_count || 0,
        opened: campaign.opened_count || 0,
        replied: campaign.replied_count || 0,
        openRate: campaign.sent_count > 0 ? Math.round(((campaign.opened_count || 0) / campaign.sent_count) * 100) : 0,
        replyRate:
          campaign.sent_count > 0 ? Math.round(((campaign.replied_count || 0) / campaign.sent_count) * 100) : 0,
      }))
      .slice(0, 10) // Show top 10 campaigns
  }, [filteredData.campaigns])

  const leadStatusData = Object.entries(metrics.leadsByStatus).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
  }))

  const leadSourceData = Object.entries(metrics.leadsBySource).map(([source, count]) => ({
    name: source.charAt(0).toUpperCase() + source.slice(1).replace("_", " "),
    value: count,
  }))

  const COLORS = ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"]

  const keyMetrics = [
    {
      title: "Total Leads",
      value: metrics.totalLeads.toString(),
      description: `${timeRange} days`,
      icon: Users,
      color: "text-primary",
      trend: metrics.totalLeads > 0 ? TrendingUp : TrendingDown,
    },
    {
      title: "Active Campaigns",
      value: metrics.totalCampaigns.toString(),
      description: "Running campaigns",
      icon: Target,
      color: "text-secondary",
    },
    {
      title: "Emails Sent",
      value: metrics.totalEmailsSent.toString(),
      description: "Total outreach",
      icon: Mail,
      color: "text-accent",
    },
    {
      title: "Open Rate",
      value: `${metrics.openRate}%`,
      description: `${metrics.totalOpened} opened`,
      icon: Eye,
      color: metrics.openRate >= 20 ? "text-primary" : "text-muted-foreground",
      trend: metrics.openRate >= 20 ? TrendingUp : TrendingDown,
    },
    {
      title: "Click Rate",
      value: `${metrics.clickRate}%`,
      description: `${metrics.totalClicked} clicked`,
      icon: MousePointer,
      color: metrics.clickRate >= 3 ? "text-primary" : "text-muted-foreground",
      trend: metrics.clickRate >= 3 ? TrendingUp : TrendingDown,
    },
    {
      title: "Reply Rate",
      value: `${metrics.replyRate}%`,
      description: `${metrics.totalReplied} replied`,
      icon: Reply,
      color: metrics.replyRate >= 5 ? "text-primary" : "text-muted-foreground",
      trend: metrics.replyRate >= 5 ? TrendingUp : TrendingDown,
    },
  ]

  const handleExport = async (format: "csv" | "json") => {
    setIsExporting(true)
    try {
      const response = await fetch("/api/analytics/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeRange,
          format,
        }),
      })

      if (response.ok) {
        if (format === "csv") {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `analytics-report-${timeRange}days.csv`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else {
          const data = await response.json()
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `analytics-report-${timeRange}days.json`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      } else {
        console.error("Export failed")
      }
    } catch (error) {
      console.error("Export error:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("json")} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export JSON"}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {keyMetrics.map((metric) => (
          <Card key={metric.title} className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
              <div className="flex items-center gap-1">
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
                {metric.trend && <metric.trend className={`h-3 w-3 ${metric.color}`} />}
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="leads">Lead Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Activity Trends</CardTitle>
                <CardDescription>Daily activity over the selected time period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="leads"
                      stackId="1"
                      stroke="#059669"
                      fill="#059669"
                      fillOpacity={0.6}
                      name="Leads Added"
                    />
                    <Area
                      type="monotone"
                      dataKey="sent"
                      stackId="2"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                      name="Emails Sent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Email Engagement</CardTitle>
                <CardDescription>Email opens and replies over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="opened"
                      stroke="#059669"
                      strokeWidth={2}
                      dot={{ fill: "#059669" }}
                      name="Opened"
                    />
                    <Line
                      type="monotone"
                      dataKey="replied"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981" }}
                      name="Replied"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Campaign Performance</CardTitle>
              <CardDescription>Compare performance across your campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={campaignPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="sent" fill="#059669" name="Sent" />
                  <Bar dataKey="opened" fill="#10b981" name="Opened" />
                  <Bar dataKey="replied" fill="#34d399" name="Replied" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Lead Status Distribution</CardTitle>
                <CardDescription>Breakdown of leads by current status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={leadStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {leadStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Lead Sources</CardTitle>
                <CardDescription>Where your leads are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={leadSourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {leadSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Performance Benchmarks</CardTitle>
                <CardDescription>How you compare to industry standards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Open Rate</span>
                    <Badge variant={metrics.openRate >= 20 ? "default" : "secondary"}>
                      {metrics.openRate}% {metrics.openRate >= 20 ? "Good" : "Needs Improvement"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">Industry average: 20-25%</div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Click Rate</span>
                    <Badge variant={metrics.clickRate >= 3 ? "default" : "secondary"}>
                      {metrics.clickRate}% {metrics.clickRate >= 3 ? "Good" : "Needs Improvement"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">Industry average: 3-5%</div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Reply Rate</span>
                    <Badge variant={metrics.replyRate >= 5 ? "default" : "secondary"}>
                      {metrics.replyRate}% {metrics.replyRate >= 5 ? "Good" : "Needs Improvement"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">Industry average: 5-10%</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-foreground">Top Performing Campaigns</CardTitle>
                <CardDescription>Campaigns with the highest engagement rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaignPerformanceData
                    .sort((a, b) => b.openRate + b.replyRate - (a.openRate + a.replyRate))
                    .slice(0, 5)
                    .map((campaign, index) => (
                      <div
                        key={campaign.name}
                        className="flex items-center justify-between p-3 border border-border rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">#{index + 1}</span>
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{campaign.name}</div>
                            <div className="text-sm text-muted-foreground">{campaign.sent} emails sent</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{campaign.openRate}% open</Badge>
                          <Badge variant="secondary">{campaign.replyRate}% reply</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
