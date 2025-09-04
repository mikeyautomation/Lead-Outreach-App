"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"

interface SettingsFormProps {
  user: User
  profile: any
}

export function SettingsForm({ user, profile }: SettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState(profile?.username || "")
  const [email, setEmail] = useState(user.email || "")
  const router = useRouter()
  const supabase = createClient()

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Update user profile
      const { error } = await supabase.from("users").update({ username, email }).eq("id", user.id)

      if (error) throw error

      // Update auth email if changed
      if (email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: email,
        })
        if (authError) throw authError
      }

      alert("Profile updated successfully!")
      router.refresh()
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Error updating profile")
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your account profile information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>Manage your account settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Account ID</h4>
              <p className="text-sm text-muted-foreground font-mono">{user.id}</p>
            </div>

            <Separator />

            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
