"use client"

import { useState } from "react"
import type { Subscription } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, ArrowLeft, Bell, Clock, Pause, Play, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface SubscriptionsClientProps {
  subscriptions: Subscription[]
  userId: string
}

export default function SubscriptionsClient({ subscriptions: initialSubscriptions, userId }: SubscriptionsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [frequency, setFrequency] = useState<"monthly" | "quarterly" | "yearly">("monthly")
  const [amount, setAmount] = useState("")
  const [reminderDays, setReminderDays] = useState("3")
  const [credentialLocation, setCredentialLocation] = useState("")
  const [isFreeTier, setIsFreeTier] = useState(false)
  const [freeStartDate, setFreeStartDate] = useState("")
  const [freeEndDate, setFreeEndDate] = useState("")

  const handleAddSubscription = async () => {
    if (!name || !startDate) {
      toast({ title: "Error", description: "Please fill required fields", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      // Calculate next billing date
      const start = new Date(startDate)
      const nextBilling = new Date(start)

      switch (frequency) {
        case "monthly":
          nextBilling.setMonth(nextBilling.getMonth() + 1)
          break
        case "quarterly":
          nextBilling.setMonth(nextBilling.getMonth() + 3)
          break
        case "yearly":
          nextBilling.setFullYear(nextBilling.getFullYear() + 1)
          break
      }

      const subscription = {
        user_id: userId,
        name,
        start_date: startDate,
        frequency,
        amount: isFreeTier ? null : amount ? Number.parseFloat(amount) : null,
        next_billing_date: nextBilling.toISOString().split("T")[0],
        reminder_days: Number.parseInt(reminderDays),
        status: "active" as const,
        credential_location: credentialLocation || null,
        free_start_date: isFreeTier && freeStartDate ? freeStartDate : null,
        free_end_date: isFreeTier && freeEndDate ? freeEndDate : null,
      }

      const { data, error } = await supabase.from("subscriptions").insert([subscription]).select().single()

      if (error) throw error

      setSubscriptions([...subscriptions, data])
      toast({ title: "Added", description: "Subscription added successfully" })

      // Reset form
      setName("")
      setAmount("")
      setStartDate(new Date().toISOString().split("T")[0])
      setFrequency("monthly")
      setReminderDays("3")
      setCredentialLocation("")
      setIsFreeTier(false)
      setFreeStartDate("")
      setFreeEndDate("")
      setShowAddDialog(false)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to add subscription", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active"
    const supabase = createClient()

    const { error } = await supabase
      .from("subscriptions")
      .update({ status: newStatus })
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      toast({ title: "Error", description: "Failed to update subscription", variant: "destructive" })
      return
    }

    setSubscriptions(subscriptions.map((sub) => (sub.id === id ? { ...sub, status: newStatus as any } : sub)))
    toast({ title: "Updated", description: `Subscription ${newStatus}` })
    router.refresh()
  }

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this subscription?")) return

    const supabase = createClient()
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      toast({ title: "Error", description: "Failed to cancel subscription", variant: "destructive" })
      return
    }

    setSubscriptions(subscriptions.map((sub) => (sub.id === id ? { ...sub, status: "cancelled" as any } : sub)))
    toast({ title: "Cancelled", description: "Subscription cancelled" })
    router.refresh()
  }

  const activeSubscriptions = subscriptions.filter((s) => s.status === "active")
  const pausedSubscriptions = subscriptions.filter((s) => s.status === "paused")
  const cancelledSubscriptions = subscriptions.filter((s) => s.status === "cancelled")

  const today = new Date()
  const isInFreePeriod = (sub: Subscription) => {
    if (!sub.free_start_date || !sub.free_end_date) return false
    const start = new Date(sub.free_start_date)
    const end = new Date(sub.free_end_date)
    return today >= start && today <= end
  }

  const totalMonthlyAmount = activeSubscriptions
    .filter((s) => s.amount)
    .reduce((sum, s) => {
      if (isInFreePeriod(s)) return sum
      const amount = s.amount || 0
      switch (s.frequency) {
        case "monthly":
          return sum + amount
        case "quarterly":
          return sum + amount / 3
        case "yearly":
          return sum + amount / 12
        default:
          return sum
      }
    }, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">Subscriptions</h1>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Monthly Estimate</p>
                <p className="text-3xl font-bold">₹{totalMonthlyAmount.toFixed(0)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Active</p>
                <p className="text-2xl font-semibold">{activeSubscriptions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        {activeSubscriptions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Active</h2>
            {activeSubscriptions.map((sub) => {
              const daysUntilBilling = sub.next_billing_date
                ? Math.ceil((new Date(sub.next_billing_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null

              return (
                <Card key={sub.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{sub.name}</h3>
                          {!sub.amount && (
                            <Badge variant="outline" className="text-xs">
                              Free
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span className="capitalize">{sub.frequency}</span>
                          </div>
                          {sub.next_billing_date && (
                            <div className="flex items-center gap-2">
                              <Bell className="h-3 w-3" />
                              <span>
                                Next billing: {new Date(sub.next_billing_date).toLocaleDateString("en-IN")}
                                {daysUntilBilling !== null && daysUntilBilling <= 7 && (
                                  <span className="text-orange-500 font-medium ml-1">({daysUntilBilling}d)</span>
                                )}
                              </span>
                            </div>
                          )}
                          {sub.free_start_date && sub.free_end_date && (
                            <div className="text-xs">
                              <span className="font-medium text-green-600 dark:text-green-400">Free tier:</span>{" "}
                              <span>
                                {new Date(sub.free_start_date).toLocaleDateString("en-IN")} →
                                {" "}
                                {new Date(sub.free_end_date).toLocaleDateString("en-IN")}
                              </span>
                            </div>
                          )}
                          {sub.credential_location && (
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                              Credentials: {sub.credential_location}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        {sub.amount && (
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">₹{sub.amount.toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground capitalize">{sub.frequency}</p>
                          </div>
                        )}

                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleStatus(sub.id, sub.status)}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleCancel(sub.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Paused Subscriptions */}
        {pausedSubscriptions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Paused</h2>
            {pausedSubscriptions.map((sub) => (
              <Card key={sub.id} className="opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{sub.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{sub.frequency}</p>
                      {sub.free_start_date && sub.free_end_date && (
                        <div className="text-xs">
                          <span className="font-medium text-green-600 dark:text-green-400">Free tier:</span>{" "}
                          <span>
                            {new Date(sub.free_start_date).toLocaleDateString("en-IN")} → {new Date(sub.free_end_date).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {sub.amount && <p className="font-semibold">₹{sub.amount.toFixed(0)}</p>}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(sub.id, sub.status)}
                        className="bg-transparent"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Cancelled Subscriptions */}
        {cancelledSubscriptions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Cancelled</h2>
            {cancelledSubscriptions.map((sub) => (
              <Card key={sub.id} className="opacity-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{sub.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{sub.frequency}</p>
                      {sub.free_start_date && sub.free_end_date && (
                        <div className="text-xs">
                          <span className="font-medium text-green-600 dark:text-green-400">Free tier:</span>{" "}
                          <span>
                            {new Date(sub.free_start_date).toLocaleDateString("en-IN")} → {new Date(sub.free_end_date).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {sub.amount && <p className="font-semibold">₹{sub.amount.toFixed(0)}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {subscriptions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="mb-4">No subscriptions yet</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Subscription
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Subscription Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subscription</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Netflix, Spotify, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date *</Label>
              <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as any)}>
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) - Leave empty for free tier</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                disabled={isFreeTier}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="free-tier">Free tier?</Label>
                <input
                  id="free-tier"
                  type="checkbox"
                  checked={isFreeTier}
                  onChange={(e) => setIsFreeTier(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
              {isFreeTier && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="free-start">Free start date</Label>
                    <Input
                      id="free-start"
                      type="date"
                      value={freeStartDate}
                      onChange={(e) => setFreeStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="free-end">Free end date</Label>
                    <Input id="free-end" type="date" value={freeEndDate} onChange={(e) => setFreeEndDate(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder">Reminder (days before)</Label>
              <Input
                id="reminder"
                type="number"
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credential">Where did you save credentials?</Label>
              <Input
                id="credential"
                value={credentialLocation}
                onChange={(e) => setCredentialLocation(e.target.value)}
                placeholder="e.g., 'Phone Notes', 'Password Manager', 'Email confirmation'"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSubscription} disabled={isSubmitting}>
              Add Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
