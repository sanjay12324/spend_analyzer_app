"use client"
import { useState } from "react"
import type { RecurringRule } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, ChevronRight, Plus, Save, Camera } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import SubItemsDialog from "@/components/sub-items-dialog"

interface AddExpenseClientProps {
  recurringRules: RecurringRule[]
  userId: string
}

interface SelectedRecurring {
  ruleId: string
  label: string
  amount: number
  unit?: string
}

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500]

export default function AddExpenseClient({ recurringRules, userId }: AddExpenseClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [date, setDate] = useState(new Date())
  const [selectedRecurring, setSelectedRecurring] = useState<Map<string, SelectedRecurring>>(new Map())

  // New expense state
  const [newAmount, setNewAmount] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newNote, setNewNote] = useState("")
  const [newUnit, setNewUnit] = useState("")
  const [newQuantity, setNewQuantity] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Sub-items dialog state
  const [showSubItemsDialog, setShowSubItemsDialog] = useState(false)
  const [subItemsCategory, setSubItemsCategory] = useState("")

  // Group recurring rules by frequency
  const groupedRules = recurringRules.reduce(
    (acc, rule) => {
      if (!acc[rule.frequency]) acc[rule.frequency] = []
      acc[rule.frequency].push(rule)
      return acc
    },
    {} as Record<string, RecurringRule[]>,
  )

  const handleToggleRecurring = (rule: RecurringRule, checked: boolean) => {
    const newMap = new Map(selectedRecurring)
    if (checked) {
      newMap.set(rule.id, {
        ruleId: rule.id,
        label: rule.label,
        amount: rule.default_amount || 0,
        unit: rule.unit,
      })
    } else {
      newMap.delete(rule.id)
    }
    setSelectedRecurring(newMap)
  }

  const handleUpdateRecurringAmount = (ruleId: string, amount: number) => {
    const newMap = new Map(selectedRecurring)
    const existing = newMap.get(ruleId)
    if (existing) {
      newMap.set(ruleId, { ...existing, amount })
    }
    setSelectedRecurring(newMap)
  }

  const handleSaveRecurring = async () => {
    if (selectedRecurring.size === 0) {
      toast({ title: "No items selected", description: "Please select at least one recurring item" })
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    try {
      const expenses = Array.from(selectedRecurring.values()).map((item) => ({
        user_id: userId,
        date: date.toISOString(),
        amount: item.amount,
        unit: item.unit,
        category_label: item.label,
        rule_id: item.ruleId,
        language_tag: "en",
      }))

      const { error } = await supabase.from("expenses").insert(expenses)

      if (error) throw error

      toast({ title: "Saved", description: `${expenses.length} expenses saved` })
      setSelectedRecurring(new Map())
      router.push("/dashboard")
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to save expenses", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNewExpense = async (items?: any[]) => {
    if (!newAmount && !items) {
      toast({ title: "Amount required", description: "Please enter an amount" })
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    try {
      const expense = {
        user_id: userId,
        date: date.toISOString(),
        amount: Number.parseFloat(newAmount) || 0,
        unit: newUnit || null,
        quantity: newQuantity ? Number.parseFloat(newQuantity) : null,
        category_label: newCategory || null,
        note: newNote || null,
        language_tag: "en",
        items: items || null,
      }

      const { error } = await supabase.from("expenses").insert([expense])

      if (error) throw error

      toast({ title: "Saved", description: "Expense saved" })
      setNewAmount("")
      setNewCategory("")
      setNewNote("")
      setNewUnit("")
      setNewQuantity("")
      router.push("/dashboard")
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to save expense", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleQuickAmount = (amount: number) => {
    setNewAmount(amount.toString())
  }

  const changeDate = (days: number) => {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() + days)
    setDate(newDate)
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)

    if (compareDate.getTime() === today.getTime()) return "Today"
    if (compareDate.getTime() === today.getTime() - 86400000) return "Yesterday"
    if (compareDate.getTime() === today.getTime() + 86400000) return "Tomorrow"
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
  }

  const handleOpenSubItems = (category: string) => {
    setSubItemsCategory(category)
    setShowSubItemsDialog(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => changeDate(-1)} className="h-10 w-10">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">{formatDate(date)}</h2>
          <Button variant="ghost" size="icon" onClick={() => changeDate(1)} className="h-10 w-10">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Recurring Items */}
        {Object.keys(groupedRules).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recurring Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(groupedRules).map(([frequency, rules]) => (
                <div key={frequency} className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{frequency}</h3>
                  {rules.map((rule) => {
                    const isSelected = selectedRecurring.has(rule.id)
                    const selectedData = selectedRecurring.get(rule.id)

                    return (
                      <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                        <Checkbox
                          id={rule.id}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleToggleRecurring(rule, checked as boolean)}
                        />
                        <Label htmlFor={rule.id} className="flex-1 cursor-pointer text-base">
                          {rule.label}
                        </Label>
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-mono">₹</span>
                            <Input
                              type="number"
                              value={selectedData?.amount || ""}
                              onChange={(e) =>
                                handleUpdateRecurringAmount(rule.id, Number.parseFloat(e.target.value) || 0)
                              }
                              className="w-24 h-10 text-right"
                              placeholder="0"
                            />
                            {rule.unit && <span className="text-sm text-muted-foreground">{rule.unit}</span>}
                          </div>
                        )}
                        {!rule.default_amount && isSelected && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenSubItems(rule.label)}
                            className="ml-2"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Items
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}

              {selectedRecurring.size > 0 && (
                <Button onClick={handleSaveRecurring} disabled={isSaving} className="w-full h-12">
                  <Save className="h-5 w-5 mr-2" />
                  Save Selected ({selectedRecurring.size})
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add New Expense */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add New Expense</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="tel"
                inputMode="decimal"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="0.00"
                className="h-12 text-lg"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {QUICK_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(amount)}
                    className="h-8"
                  >
                    ₹{amount}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  inputMode="decimal"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  placeholder="1"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="kg/ltr/piece"
                  className="h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g., Food, Transport"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (English/Tamil/Thanglish)</Label>
              <Input
                id="note"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="h-12"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-12 bg-transparent" disabled>
                <Camera className="h-5 w-5 mr-2" />
                OCR Scan
              </Button>
              <Button onClick={() => handleSaveNewExpense()} disabled={isSaving} className="flex-1 h-12">
                <Save className="h-5 w-5 mr-2" />
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Add Bar placeholder */}
        <div className="h-20" />
      </div>

      {/* Bottom Quick Add Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            type="tel"
            inputMode="decimal"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder="Quick amount"
            className="h-12"
          />
          <Button variant="outline" size="icon" className="h-12 w-12 bg-transparent" disabled>
            <Camera className="h-5 w-5" />
          </Button>
          <Button onClick={() => handleSaveNewExpense()} disabled={isSaving || !newAmount} className="h-12 px-6">
            <Plus className="h-5 w-5 mr-2" />
            Add
          </Button>
        </div>
      </div>

      <SubItemsDialog
        isOpen={showSubItemsDialog}
        onClose={() => setShowSubItemsDialog(false)}
        category={subItemsCategory}
        onSave={(items) => {
          handleSaveNewExpense(items)
          setShowSubItemsDialog(false)
        }}
      />
    </div>
  )
}
