import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const trackingId = searchParams.get("id")

  if (!trackingId) {
    return new NextResponse("Missing tracking ID", { status: 400 })
  }

  try {
    const supabase = await createClient()

    // Update email tracking record with opened timestamp
    const { error } = await supabase
      .from("email_tracking")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", trackingId)
      .is("opened_at", null) // Only update if not already opened

    if (error) {
      console.error("Error tracking email open:", error)
    }

    // Return a 1x1 transparent pixel
    const pixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64",
    )

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error in email tracking:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
