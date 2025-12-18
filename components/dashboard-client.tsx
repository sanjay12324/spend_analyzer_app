"use client"

import { useState, useMemo } from "react"
import type { Expense, Income, RecurringRule } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { DateRangePicker, type DateRange } from "@/components/date-range-picker"
import { startOfMonth, endOfMonth } from "date-fns"

interface DashboardClientProps {
  expenses: Expense[]
  incomes: Income[]
  recurringRules: RecurringRule[]
  userId: string
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export default function DashboardClient({ expenses, incomes, recurringRules }: DashboardClientProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"recurring" | "new">("recurring")
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [showCustomRange, setShowCustomRange] = useState(false)

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  // Calculate totals
  const totalSpent = useMemo(
    () => expenses.reduce((sum, exp) => sum + Number.parseFloat(exp.amount.toString()), 0),
    [expenses],
  )

  const totalIncome = useMemo(
    () => incomes.reduce((sum, inc) => sum + Number.parseFloat(inc.amount.toString()), 0),
    [incomes],
  )

  const netAmount = totalIncome - totalSpent

  // Calculate recurring expenses
  const recurringExpenses = useMemo(() => {
    const monthlyRecurring = recurringRules
      .filter((r) => r.frequency === "monthly")
      .reduce((sum, r) => sum + (r.default_amount || 0), 0)

    const weeklyRecurring =
      recurringRules.filter((r) => r.frequency === "weekly").reduce((sum, r) => sum + (r.default_amount || 0), 0) * 4

    const dailyRecurring =
      recurringRules.filter((r) => r.frequency === "daily").reduce((sum, r) => sum + (r.default_amount || 0), 0) * 30

    return monthlyRecurring + weeklyRecurring + dailyRecurring
  }, [recurringRules])

  // Trend data
  const trendData = useMemo(() => {
    const dailyTotals = new Map<string, number>()
    expenses
      .filter((exp) => {
        const d = new Date(exp.date)
        return d >= customDateRange.from && d <= customDateRange.to
      })
      .forEach((exp) => {
      const date = new Date(exp.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      dailyTotals.set(date, (dailyTotals.get(date) || 0) + Number.parseFloat(exp.amount.toString()))
    })

    return Array.from(dailyTotals.entries())
      .map(([date, spent]) => ({ date, spent }))
      .slice(-14) // Last 14 days
  }, [expenses, customDateRange])

  // Category breakdown
  const categoryData = useMemo(() => {
    const categoryTotals = new Map<string, number>()
    expenses
      .filter((exp) => {
        const d = new Date(exp.date)
        return d >= customDateRange.from && d <= customDateRange.to
      })
      .forEach((exp) => {
      const category = exp.category_label || "Other"
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + Number.parseFloat(exp.amount.toString()))
    })

    return Array.from(categoryTotals.entries())
      .map(([label, amount]) => ({ label, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5) // Top 5 categories
  }, [expenses, customDateRange])

  // Filter expenses by type
  const filteredExpenses = useMemo(() => {
    const inRange = expenses.filter((exp) => {
      const d = new Date(exp.date)
      return d >= customDateRange.from && d <= customDateRange.to
    })
    if (viewMode === "recurring") {
      return inRange.filter((exp) => exp.rule_id)
    }
    return inRange.filter((exp) => !exp.rule_id)
  }, [expenses, viewMode, customDateRange])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Dashboard
          </h1>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Date Range Picker */}
        <div className="flex gap-2 items-center">
          <DateRangePicker value={customDateRange} onChange={setCustomDateRange} />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingDown className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{totalSpent.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Income</CardTitle>
              <TrendingUp className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{totalIncome.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card
            className={`bg-gradient-to-br ${netAmount >= 0 ? "from-accent/10 to-accent/5 border-accent/20" : "from-destructive/10 to-destructive/5 border-destructive/20"}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Net</CardTitle>
              <Wallet className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center gap-2">
                {netAmount >= 0 ? (
                  <ArrowUpRight className="h-6 w-6 text-accent" />
                ) : (
                  <ArrowDownRight className="h-6 w-6 text-destructive" />
                )}
                ₹{Math.abs(netAmount).toFixed(0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{netAmount >= 0 ? "Surplus" : "Deficit"}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recurring</CardTitle>
              <Calendar className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{recurringExpenses.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Monthly estimate</p>
            </CardContent>
          </Card>
        </div>

        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Spending Trend</CardTitle>
              <div className="w-64">
                <DateRangePicker value={customDateRange} onChange={setCustomDateRange} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="spent"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorSpent)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData.map((category, index) => (
                  <div key={category.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium">{category.label}</span>
                    </div>
                    <span className="text-sm font-semibold">₹{category.amount.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "recurring" | "new")}>
                <TabsList>
                  <TabsTrigger value="recurring">Recurring</TabsTrigger>
                  <TabsTrigger value="new">New</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredExpenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions yet</p>
              ) : (
                filteredExpenses.slice(0, 10).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{expense.category_label || "Expense"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-destructive">
                        -₹{Number.parseFloat(expense.amount.toString()).toFixed(0)}
                      </p>
                      {expense.note && <p className="text-xs text-muted-foreground">{expense.note}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Action Button */}
      <Link href="/dashboard/add">
        <Button
          size="lg"
          className="fixed right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-[60] bottom-[88px] sm:bottom-[96px]"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  )
}
