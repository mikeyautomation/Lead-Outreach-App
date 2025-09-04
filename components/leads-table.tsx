"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Edit, Trash2, Mail } from "lucide-react"
import { useRouter } from "next/navigation"

interface Lead {
  id: string
  contact_name: string
  email: string
  company_name: string
  title: string
  phone: string
  status: string
  created_at: string
  location: string
  industry: string
}

interface LeadsTableProps {
  leads: Lead[]
}

export function LeadsTable({ leads: initialLeads }: LeadsTableProps) {
  const [leads, setLeads] = useState(initialLeads)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()

  const filteredLeads = leads.filter(
    (lead) =>
      lead.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async (leadId: string) => {
    setIsDeleting(leadId)
    const supabase = createClient()

    const { error } = await supabase.from("leads").delete().eq("id", leadId)

    if (error) {
      console.error("Error deleting lead:", error)
    } else {
      setLeads(leads.filter((lead) => lead.id !== leadId))
    }
    setIsDeleting(null)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { label: "New", variant: "secondary" as const },
      contacted: { label: "Contacted", variant: "default" as const },
      qualified: { label: "Qualified", variant: "default" as const },
      converted: { label: "Converted", variant: "default" as const },
      unqualified: { label: "Unqualified", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (leads.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Mail className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">No leads yet</h3>
              <p className="text-muted-foreground">Get started by adding your first lead or importing from CSV.</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push("/dashboard/leads/import")}>
                Import CSV
              </Button>
              <Button onClick={() => router.push("/dashboard/leads/new")}>Add Lead</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground">All Leads ({leads.length})</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
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
                <TableHead>Contact</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground">{lead.contact_name || "N/A"}</div>
                      <div className="text-sm text-muted-foreground">{lead.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{lead.company_name || "N/A"}</div>
                    <div className="text-sm text-muted-foreground">{lead.industry || "N/A"}</div>
                  </TableCell>
                  <TableCell className="text-foreground">{lead.title || "N/A"}</TableCell>
                  <TableCell>{getStatusBadge(lead.status || "new")}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.location || "N/A"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/leads/${lead.id}`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(lead.id)}
                          disabled={isDeleting === lead.id}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {isDeleting === lead.id ? "Deleting..." : "Delete"}
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
