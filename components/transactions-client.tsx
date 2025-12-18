"use client"

import { useState, useMemo } from "react"
import type { Expense } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Edit, Trash2, Calendar, ArrowLeft, Repeat, Upload, Download } from "lucide-react"
import { t } from "@/lib/i18n"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface TransactionsClientProps {
  expenses: Expense[]
  userId: string
}

export default function TransactionsClient({ expenses: initialExpenses, userId }: TransactionsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [expenses, setExpenses] = useState(initialExpenses)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "recurring" | "new">("all")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      exp.category_label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.note?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      filterType === "all" || (filterType === "recurring" && exp.rule_id) || (filterType === "new" && !exp.rule_id)

    return matchesSearch && matchesFilter
  })

  // Heuristic: detect potential recurring transactions (same category & similar amount within ~10% every 7±2 days)
  const detectedRecurringIds = useMemo(() => {
    const map = new Map<string, Expense[]>()
    expenses.forEach((e) => {
      const key = `${e.category_label}-${Math.round(Number.parseFloat(e.amount.toString()) / 100)}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    })

    const recurringIds = new Set<string>()
    map.forEach((list) => {
      const sorted = list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1]
        const curr = sorted[i]
        const days = Math.abs((new Date(curr.date).getTime() - new Date(prev.date).getTime()) / (1000 * 60 * 60 * 24))
        const amtPrev = Number.parseFloat(prev.amount.toString())
        const amtCurr = Number.parseFloat(curr.amount.toString())
        const similar = Math.abs(amtPrev - amtCurr) / Math.max(amtPrev, amtCurr) <= 0.1
        if (days >= 5 && days <= 9 && similar) {
          recurringIds.add(curr.id)
          recurringIds.add(prev.id)
        }
      }
    })
    return recurringIds
  }, [expenses])

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return

    const supabase = createClient()
    const { error } = await supabase.from("expenses").delete().eq("id", id).eq("user_id", userId)

    if (error) {
      toast({ title: "Error", description: "Failed to delete expense", variant: "destructive" })
      return
    }

    setExpenses(expenses.filter((exp) => exp.id !== id))
    toast({ title: "Deleted", description: "Expense deleted successfully" })
    router.refresh()
  }

  const groupByDate = (expenses: Expense[]) => {
    const groups = new Map<string, Expense[]>()

    expenses.forEach((exp) => {
      const date = new Date(exp.date).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      if (!groups.has(date)) groups.set(date, [])
      groups.get(date)?.push(exp)
    })

    return Array.from(groups.entries())
  }

  const groupedExpenses = groupByDate(filteredExpenses)

  const exportCSV = () => {
    const headers = [
      "date",
      "amount",
      "category_label",
      "note",
      "quantity",
      "unit",
      "rule_id",
    ]
    const rows = expenses.map((e) => [
      new Date(e.date).toISOString(),
      Number.parseFloat(e.amount.toString()),
      e.category_label || "",
      e.note || "",
      e.quantity || "",
      e.unit || "",
      e.rule_id || "",
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => String(v).replace(/"/g, '""')).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "transactions.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const importCSV = async (file: File) => {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (lines.length < 2) return
    const headers = lines[0].split(",")
    const supabase = createClient()
    const newItems: Partial<Expense>[] = []

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",")
      const obj: any = {}
      headers.forEach((h, idx) => {
        obj[h] = cols[idx] ?? ""
      })
      const item: Partial<Expense> = {
        user_id: userId as any,
        date: obj.date ? new Date(obj.date).toISOString() : new Date().toISOString(),
        amount: Number.parseFloat(obj.amount || "0"),
        category_label: obj.category_label || null,
        note: obj.note || null,
        quantity: obj.quantity ? Number(obj.quantity) : null,
        unit: obj.unit || null,
        rule_id: obj.rule_id || null,
      }
      newItems.push(item)
    }

    const { data, error } = await supabase.from("expenses").insert(newItems).select()
    if (error) {
      toast({ title: "Import failed", description: error.message, variant: "destructive" })
      return
    }
    setExpenses([...(data as Expense[]), ...expenses])
    toast({ title: "Imported", description: `Added ${data?.length || 0} transactions` })
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Transactions</h1>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchTransactions")}
                className="pl-10 h-11"
              />
            </div>
            <Button variant="outline" size="icon" className="h-11 w-11 bg-transparent">
              <Filter className="h-5 w-5" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) importCSV(file)
                if (fileInputRef.current) fileInputRef.current.value = ""
              }}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="h-11">
              <Upload className="h-5 w-5 mr-2" />
              {t("importCsv")}
            </Button>
            <Button onClick={exportCSV} className="h-11">
              <Download className="h-5 w-5 mr-2" />
              {t("exportCsv")}
            </Button>
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
            >
              All
            </Button>
            <Button
              variant={filterType === "recurring" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("recurring")}
            >
              Recurring
            </Button>
            <Button
              variant={filterType === "new" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("new")}
            >
              New
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {groupedExpenses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>No transactions found</p>
            </CardContent>
          </Card>
        ) : (
          groupedExpenses.map(([date, expenses]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {date}
              </div>

              {expenses.map((expense) => (
                <Card key={expense.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{expense.category_label || "Expense"}</h3>
                          {expense.rule_id && (
                            <Badge variant="secondary" className="text-xs">
                              {t("recurring")}
                            </Badge>
                          )}
                          {!expense.rule_id && detectedRecurringIds.has(expense.id) && (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <Repeat className="h-3 w-3" />
                              {t("suggestRecurring")}
                            </Badge>
                          )}
                        </div>
                        {expense.note && <p className="text-sm text-muted-foreground mb-2">{expense.note}</p>}
                        {expense.items && (
                          <div className="text-xs text-muted-foreground">
                            {JSON.parse(JSON.stringify(expense.items)).length} sub-items
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                          {expense.quantity && (
                            <span>
                              Qty: {expense.quantity} {expense.unit}
                            </span>
                          )}
                          <span className="text-xs">
                            {new Date(expense.date).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-destructive">
                            ₹{Number.parseFloat(expense.amount.toString()).toFixed(0)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
