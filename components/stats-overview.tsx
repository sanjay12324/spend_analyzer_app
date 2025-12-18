"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react"
import { useMemo } from "react"

interface StatsOverviewProps {
  expenses: Array<{ amount: number; date: string }>
  previousExpenses: Array<{ amount: number; date: string }>
}

export default function StatsOverview({ expenses, previousExpenses }: StatsOverviewProps) {
  const currentTotal = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses])
  const previousTotal = useMemo(() => previousExpenses.reduce((sum, e) => sum + e.amount, 0), [previousExpenses])

  const percentageChange = useMemo(() => {
    if (previousTotal === 0) return 0
    return ((currentTotal - previousTotal) / previousTotal) * 100
  }, [currentTotal, previousTotal])

  const avgDailySpend = useMemo(() => {
    if (expenses.length === 0) return 0
    return currentTotal / expenses.length
  }, [currentTotal, expenses.length])

  const isIncreased = percentageChange > 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total This Month</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{currentTotal.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">{expenses.length} transactions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">vs Last Month</CardTitle>
          {isIncreased ? (
            <TrendingUp className="h-4 w-4 text-destructive" />
          ) : (
            <TrendingDown className="h-4 w-4 text-accent" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isIncreased ? "text-destructive" : "text-accent"}`}>
            {isIncreased ? "+" : ""}
            {percentageChange.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">₹{previousTotal.toLocaleString()} last month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{avgDailySpend.toFixed(0)}</div>
          <p className="text-xs text-muted-foreground mt-1">per transaction</p>
        </CardContent>
      </Card>
    </div>
  )
}
