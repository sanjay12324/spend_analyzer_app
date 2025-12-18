export interface Expense {
  id: string
  user_id: string
  date: string
  amount: number
  unit?: string
  quantity?: number
  note?: string
  language_tag?: string
  category_label?: string
  rule_id?: string
  items?: ExpenseItem[]
  created_at: string
}

export interface ExpenseItem {
  name: string
  quantity: number
  unit: string
  amount: number
}

export interface RecurringRule {
  id: string
  user_id: string
  label: string
  default_amount?: number
  unit?: string
  frequency: "daily" | "weekly" | "monthly" | "custom"
  weekday_or_day?: number
  auto_create: boolean
  match_heuristics?: Record<string, unknown>
  last_applied_date?: string
  active: boolean
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  name: string
  start_date: string
  frequency: "monthly" | "quarterly" | "yearly" | "custom"
  amount?: number
  next_billing_date?: string
  reminder_days: number
  status: "active" | "paused" | "cancelled"
  credential_location?: string
  free_start_date?: string
  free_end_date?: string
  credential_meta?: Record<string, unknown>
  created_at: string
}

export interface Income {
  id: string
  user_id: string
  amount: number
  type: "monthly_salary" | "bonus" | "other"
  date_received: string
  note?: string
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  category_label: string
  monthly_limit: number
  month: number
  year: number
  created_at: string
}
