"use client"

import { useState } from "react"
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay, subDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

export interface DateRange {
  from: Date
  to: Date
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  placeholder?: string
  disabled?: boolean
}

export function DateRangePicker({ value, onChange, placeholder = "Pick a date range", disabled = false }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [localFrom, setLocalFrom] = useState<Date>(value.from)
  const [localTo, setLocalTo] = useState<Date>(value.to)

  const handleQuickSelect = (range: DateRange) => {
    setLocalFrom(range.from)
    setLocalTo(range.to)
    onChange(range)
    setOpen(false)
  }

  const handleApply = () => {
    if (localFrom && localTo) {
      onChange({ from: localFrom, to: localTo })
      setOpen(false)
    }
  }

  const today = new Date()
  const quickOptions = [
    { label: "Today", range: { from: startOfDay(today), to: endOfDay(today) } },
    { label: "Last 7 days", range: { from: subDays(startOfDay(today), 6), to: endOfDay(today) } },
    { label: "This month", range: { from: startOfMonth(today), to: endOfMonth(today) } },
    { label: "This year", range: { from: startOfYear(today), to: endOfYear(today) } },
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="w-full justify-start text-left font-normal"
        >
          <Calendar className="mr-2 h-4 w-4" />
          {value.from && value.to
            ? `${format(value.from, "MMM dd, yyyy")} - ${format(value.to, "MMM dd, yyyy")}`
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="grid grid-cols-2 gap-4 p-4">
          <div>
            <label className="text-sm font-medium mb-2 block">From</label>
            <CalendarComponent
              mode="single"
              selected={localFrom}
              onSelect={(date) => date && setLocalFrom(date)}
              disabled={(date) => date > localTo}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">To</label>
            <CalendarComponent
              mode="single"
              selected={localTo}
              onSelect={(date) => date && setLocalTo(date)}
              disabled={(date) => date < localFrom}
            />
          </div>
        </div>

        <div className="border-t p-4 space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">Quick select</p>
            <div className="grid grid-cols-2 gap-2">
              {quickOptions.map((option) => (
                <Button
                  key={option.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(option.range)}
                  className="text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleApply}
              disabled={!localFrom || !localTo}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
