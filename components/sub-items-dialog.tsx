"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"

interface SubItem {
  name: string
  quantity: number
  unit: string
  amount: number
}

interface SubItemsDialogProps {
  isOpen: boolean
  onClose: () => void
  category: string
  onSave: (items: SubItem[]) => void
}

export default function SubItemsDialog({ isOpen, onClose, category, onSave }: SubItemsDialogProps) {
  const [items, setItems] = useState<SubItem[]>([{ name: "", quantity: 1, unit: "kg", amount: 0 }])

  const addItem = () => {
    setItems([...items, { name: "", quantity: 1, unit: "kg", amount: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof SubItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSave = () => {
    const validItems = items.filter((item) => item.name && item.amount > 0)
    if (validItems.length === 0) return
    onSave(validItems)
    setItems([{ name: "", quantity: 1, unit: "kg", amount: 0 }])
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{category} - Sub Items</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {items.map((item, index) => (
            <div key={index} className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Item {index + 1}</Label>
                {items.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`name-${index}`}>Name</Label>
                <Input
                  id={`name-${index}`}
                  value={item.name}
                  onChange={(e) => updateItem(index, "name", e.target.value)}
                  placeholder="Item name"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor={`quantity-${index}`}>Qty</Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`unit-${index}`}>Unit</Label>
                  <Input
                    id={`unit-${index}`}
                    value={item.unit}
                    onChange={(e) => updateItem(index, "unit", e.target.value)}
                    placeholder="kg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`amount-${index}`}>₹ Amount</Label>
                  <Input
                    id={`amount-${index}`}
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateItem(index, "amount", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addItem} className="w-full bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total</span>
              <span>₹ {totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Items</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
