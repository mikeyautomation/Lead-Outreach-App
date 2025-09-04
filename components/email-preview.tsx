"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { generateEmailPreview, defaultSampleVariables } from "@/lib/email-utils"

interface EmailPreviewProps {
  subject: string
  content: string
  className?: string
}

export function EmailPreview({ subject, content, className }: EmailPreviewProps) {
  const previewContent = generateEmailPreview(content, defaultSampleVariables)
  const previewSubject = generateEmailPreview(subject, defaultSampleVariables)

  return (
    <Card className={`border-border ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground">Email Preview</CardTitle>
          <Badge variant="secondary">Sample Data</Badge>
        </div>
        <CardDescription>Preview how your email will look to recipients</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border border-border rounded-md p-4 bg-card">
            <div className="space-y-3">
              <div className="border-b border-border pb-3">
                <div className="text-sm text-muted-foreground mb-1">Subject:</div>
                <div className="font-medium text-foreground">{previewSubject}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Content:</div>
                <div
                  className="prose prose-sm max-w-none text-foreground"
                  dangerouslySetInnerHTML={{
                    __html: previewContent.replace(/\n/g, "<br>"),
                  }}
                />
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Variables like {`{{contact_name}}`} and {`{{company_name}}`} will be replaced with actual lead data when
            sent.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
