"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { createBrowserClient } from "@/lib/supabase/client"
import { Plus, TrendingUp, CalendarIcon, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type Income = {
  id: string
  description: string
  amount: number
  date: string
  source: string
  is_recurring: boolean
  frequency?: string
  created_at: string
}

export default function IncomeClient() {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [source, setSource] = useState("salary")
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState("monthly")
  const [date, setDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    fetchIncomes()
  }, [])

  const fetchIncomes = async () => {
    const { data } = await supabase.from("incomes").select("*").order("date", { ascending: false })
    if (data) setIncomes(data)
  }

  const handleAddIncome = async () => {
    if (!description || !amount) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("incomes").insert({
        description,
        amount: Number.parseFloat(amount),
        date: format(date, "yyyy-MM-dd"),
        source,
        is_recurring: isRecurring,
        frequency: isRecurring ? frequency : null,
      })

      if (!error) {
        setDescription("")
        setAmount("")
        setIsAdding(false)
        fetchIncomes()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from("incomes").delete().eq("id", id)
    fetchIncomes()
  }

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0)
  const recurringIncome = incomes.filter((i) => i.is_recurring).reduce((sum, income) => sum + income.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Income Tracking</h1>
          <Button onClick={() => setIsAdding(!isAdding)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Add Income
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Income (This Month)</CardDescription>
              <CardTitle className="text-3xl">₹{totalIncome.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Recurring Income</CardDescription>
              <CardTitle className="text-3xl text-primary">₹{recurringIncome.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Add Income Form */}
        {isAdding && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Income</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="e.g., Monthly Salary"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary">Salary</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(date, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label>Recurring Income</Label>
                {isRecurring && (
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddIncome} disabled={isLoading} className="flex-1">
                  Save Income
                </Button>
                <Button onClick={() => setIsAdding(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Income List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Income History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {incomes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No income records yet. Add your first one!</p>
              ) : (
                incomes.map((income) => (
                  <div
                    key={income.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{income.description}</p>
                        {income.is_recurring && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {income.frequency}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">{income.source}</p>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-sm text-muted-foreground">{format(new Date(income.date), "PPP")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xl font-bold text-primary">₹{income.amount.toLocaleString()}</p>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(income.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
