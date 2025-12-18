"use client"

import { Card } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react"

interface QuickStatsProps {
  label: string
  value: string
  change?: number
  icon?: "up" | "down" | "trend"
  className?: string
}

export default function QuickStats({ label, value, change, icon = "up", className = "" }: QuickStatsProps) {
  const Icon = icon === "up" ? ArrowUpRight : icon === "down" ? ArrowDownRight : TrendingUp
  const changeColor = change && change > 0 ? "text-accent" : "text-destructive"

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${changeColor}`}>
              <Icon className="h-4 w-4" />
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
