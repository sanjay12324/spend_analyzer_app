"use client"

import { useState, useMemo } from "react"
import type { Budget, Expense } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Plus, ArrowLeft, AlertTriangle, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useNotifications } from "@/hooks/use-notifications"

interface BudgetsClientProps {
  budgets: Budget[]
  expenses: Expense[]
  userId: string
}

export default function BudgetsClient({ budgets: initialBudgets, expenses, userId }: BudgetsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { notify } = useNotifications()
  const [budgets, setBudgets] = useState(initialBudgets)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [category, setCategory] = useState("")
  const [limit, setLimit] = useState("")

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Calculate spending by category
  const categorySpending = useMemo(() => {
    const spending = new Map<string, number>()

    expenses.forEach((exp) => {
      const cat = exp.category_label || "Other"
      spending.set(cat, (spending.get(cat) || 0) + Number.parseFloat(exp.amount.toString()))
    })

    return spending
  }, [expenses])

  // Notify when budget thresholds are crossed
  useEffect(() => {
    budgets.forEach((b) => {
      const spent = categorySpending.get(b.category_label) || 0
      const pct = b.monthly_limit > 0 ? (spent / b.monthly_limit) * 100 : 0
      if (pct >= 90 && pct < 100) {
        notify({
          title: `Approaching budget for ${b.category_label}`,
          message: `You've used ${pct.toFixed(0)}% of ₹${b.monthly_limit.toFixed(0)}.`,
          type: "warning",
        })
      } else if (pct >= 100) {
        notify({
          title: `Budget exceeded for ${b.category_label}`,
          message: `Spent ₹${spent.toFixed(0)} over limit ₹${b.monthly_limit.toFixed(0)}.`,
          type: "error",
        })
      }
    })
  }, [budgets, categorySpending, notify])

  // Get all categories
  const allCategories = useMemo(() => {
    const categories = new Set<string>()
    expenses.forEach((exp) => {
      if (exp.category_label) categories.add(exp.category_label)
    })
    budgets.forEach((b) => categories.add(b.category_label))
    return Array.from(categories).sort()
  }, [expenses, budgets])

  const handleAddBudget = async () => {
    if (!category || !limit) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" })
      return
    }

    // Check if budget already exists for this category
    if (budgets.some((b) => b.category_label === category)) {
      toast({ title: "Error", description: "Budget already exists for this category", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const budget = {
        user_id: userId,
        category_label: category,
        monthly_limit: Number.parseFloat(limit),
        month: currentMonth,
        year: currentYear,
      }

      const { data, error } = await supabase.from("budgets").insert([budget]).select().single()

      if (error) throw error

      setBudgets([...budgets, data])
      toast({ title: "Added", description: "Budget added successfully" })

      setCategory("")
      setLimit("")
      setShowAddDialog(false)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to add budget", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteBudget = async (id: string) => {
    if (!confirm("Delete this budget?")) return

    const supabase = createClient()
    const { error } = await supabase.from("budgets").delete().eq("id", id).eq("user_id", userId)

    if (error) {
      toast({ title: "Error", description: "Failed to delete budget", variant: "destructive" })
      return
    }

    setBudgets(budgets.filter((b) => b.id !== id))
    toast({ title: "Deleted", description: "Budget deleted" })
    router.refresh()
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.monthly_limit, 0)
  const totalSpent = Array.from(categorySpending.values()).reduce((sum, amount) => sum + amount, 0)

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
              <h1 className="text-2xl font-bold">Budgets</h1>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Overall Summary */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
          <CardHeader>
            <CardTitle>Overall Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                ₹{totalSpent.toFixed(0)} of ₹{totalBudget.toFixed(0)}
              </span>
              <span className="font-semibold">
                {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <Progress value={totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0} className="h-3" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className={`font-semibold ${totalSpent > totalBudget ? "text-destructive" : "text-accent"}`}>
                ₹{Math.abs(totalBudget - totalSpent).toFixed(0)} {totalSpent > totalBudget ? "over budget" : "left"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Category Budgets */}
        {budgets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="mb-4">No budgets set for this month</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-5 w-5 mr-2" />
                Set Your First Budget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {budgets.map((budget) => {
              const spent = categorySpending.get(budget.category_label) || 0
              const percentage = (spent / budget.monthly_limit) * 100
              const isOverBudget = spent > budget.monthly_limit

              return (
                <Card key={budget.id} className={isOverBudget ? "border-destructive/50" : ""}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{budget.category_label}</h3>
                            {isOverBudget && <AlertTriangle className="h-4 w-4 text-destructive" />}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            ₹{spent.toFixed(0)} of ₹{budget.monthly_limit.toFixed(0)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className={`text-2xl font-bold ${isOverBudget ? "text-destructive" : "text-primary"}`}>
                            {percentage.toFixed(0)}%
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive mt-1"
                            onClick={() => handleDeleteBudget(budget.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>

                      <Progress
                        value={percentage > 100 ? 100 : percentage}
                        className={`h-2 ${isOverBudget ? "[&>div]:bg-destructive" : ""}`}
                      />

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Remaining: ₹{Math.max(0, budget.monthly_limit - spent).toFixed(0)}</span>
                        {isOverBudget && (
                          <span className="text-destructive font-medium">
                            Over by ₹{(spent - budget.monthly_limit).toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Unbudgeted Spending */}
        {Array.from(categorySpending.entries())
          .filter(([cat]) => !budgets.some((b) => b.category_label === cat))
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Unbudgeted Spending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from(categorySpending.entries())
                  .filter(([cat]) => !budgets.some((b) => b.category_label === cat))
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">{category}</span>
                      <span className="text-sm font-semibold">₹{amount.toFixed(0)}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Budget Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Budget</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Food, Transport"
                list="categories"
              />
              <datalist id="categories">
                {allCategories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Monthly Limit (₹)</Label>
              <Input
                id="limit"
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="5000"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Set a monthly spending limit for {category || "this category"}. You'll be notified when you approach or
              exceed it.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBudget} disabled={isSubmitting}>
              Set Budget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
