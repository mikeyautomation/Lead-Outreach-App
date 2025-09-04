"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, Download, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { EmailValidator } from "@/lib/email-validator"

interface ImportResult {
  success: number
  errors: string[]
  total: number
  invalidEmails: number
}

export function CSVImportForm() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile)
      setError(null)
      setResult(null)
    } else {
      setError("Please select a valid CSV file")
      setFile(null)
    }
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    const rows = lines.slice(1)

    return rows.map((row) => {
      const values = row.split(",").map((v) => v.trim().replace(/"/g, ""))
      const obj: any = {}
      headers.forEach((header, index) => {
        obj[header.toLowerCase().replace(/\s+/g, "_")] = values[index] || ""
      })
      return obj
    })
  }

  const handleImport = async () => {
    if (!file) return

    setIsLoading(true)
    setProgress(0)
    setError(null)

    try {
      const text = await file.text()
      const rows = parseCSV(text)

      if (rows.length === 0) {
        setError("No valid data found in CSV file")
        setIsLoading(false)
        return
      }

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in to import leads")
        setIsLoading(false)
        return
      }

      const importResult: ImportResult = {
        success: 0,
        errors: [],
        total: rows.length,
        invalidEmails: 0,
      }

      // Process rows in batches
      const batchSize = 10
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize)

        for (const [index, row] of batch.entries()) {
          const rowNumber = i + index + 2 // +2 for header row and 1-based indexing

          try {
            // Map CSV columns to database columns
            const leadData = {
              contact_name: row.contact_name || row.name || row.full_name || "",
              email: row.email || row.email_address || "",
              company_name: row.company_name || row.company || "",
              title: row.title || row.job_title || row.position || "",
              phone: row.phone || row.phone_number || "",
              location: row.location || row.city || "",
              industry: row.industry || "",
              company_website: row.company_website || row.website || "",
              linkedin_url: row.linkedin_url || row.linkedin || "",
              notes: row.notes || "",
              status: "new",
              source: "csv_import",
              user_id: user.id,
            }

            // Validate required fields
            if (!leadData.email) {
              importResult.errors.push(`Row ${rowNumber}: Email is required`)
              continue
            }

            const emailValidation = EmailValidator.validateEmail(leadData.email)
            if (!emailValidation.isValid) {
              importResult.invalidEmails++
              importResult.errors.push(
                `Row ${rowNumber}: Invalid email (${emailValidation.reason})${
                  emailValidation.suggestion ? ` - Suggestion: ${emailValidation.suggestion}` : ""
                }`,
              )
              continue
            }

            const { error: insertError } = await supabase.from("leads").insert(leadData)

            if (insertError) {
              importResult.errors.push(`Row ${rowNumber}: ${insertError.message}`)
            } else {
              importResult.success++
            }
          } catch (err) {
            importResult.errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : "Unknown error"}`)
          }
        }

        // Update progress
        setProgress(Math.round(((i + batch.length) / rows.length) * 100))
      }

      setResult(importResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process CSV file")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadTemplate = () => {
    const template = `contact_name,email,company_name,title,phone,location,industry,company_website,linkedin_url,notes
John Doe,john@example.com,Acme Corp,Marketing Director,+1-555-123-4567,San Francisco CA,Technology,https://acme.com,https://linkedin.com/in/johndoe,Interested in our product
Jane Smith,jane@company.com,Tech Solutions,CEO,+1-555-987-6543,New York NY,Software,https://techsolutions.com,https://linkedin.com/in/janesmith,Follow up next week`

    const blob = new Blob([template], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "leads_template.csv"
    a.click()
    URL.revokeObjectURL(url)
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Upload CSV File</CardTitle>
              <CardDescription>Select a CSV file containing your lead data to import.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="csv-file">CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground">Maximum file size: 10MB. Only CSV files are supported.</p>
              </div>

              {file && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Selected file: <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KB)
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isLoading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Importing leads...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {result && (
                <Alert variant={result.errors.length > 0 ? "destructive" : "default"}>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>
                        <strong>Import completed:</strong> {result.success} of {result.total} leads imported
                        successfully.
                      </p>
                      {result.invalidEmails > 0 && (
                        <p className="text-amber-600">
                          <strong>Invalid emails:</strong> {result.invalidEmails} leads skipped due to invalid email
                          addresses.
                        </p>
                      )}
                      {result.errors.length > 0 && (
                        <div>
                          <p className="font-medium">Errors:</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {result.errors.slice(0, 5).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                            {result.errors.length > 5 && <li>... and {result.errors.length - 5} more errors</li>}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button onClick={handleImport} disabled={!file || isLoading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {isLoading ? "Importing..." : "Import Leads"}
                </Button>
                {result && result.success > 0 && (
                  <Button variant="outline" onClick={() => router.push("/dashboard/leads")}>
                    View Imported Leads
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">CSV Format</CardTitle>
              <CardDescription>Download a template or follow this format for your CSV file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" onClick={downloadTemplate} className="w-full bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>

              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-foreground">Required Columns:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• email (required)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-foreground">Optional Columns:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• contact_name</li>
                    <li>• company_name</li>
                    <li>• title</li>
                    <li>• phone</li>
                    <li>• location</li>
                    <li>• industry</li>
                    <li>• company_website</li>
                    <li>• linkedin_url</li>
                    <li>• notes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
