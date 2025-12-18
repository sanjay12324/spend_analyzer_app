type Locale = "en" | "ta"

const dictionaries: Record<Locale, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    transactions: "Transactions",
    subscriptions: "Subscriptions",
    budgets: "Budgets",
    add: "Add",
    totalSpent: "Total Spent",
    income: "Income",
    net: "Net",
    dateRange: "Date Range",
    searchTransactions: "Search transactions...",
    importCsv: "Import CSV",
    exportCsv: "Export CSV",
    recurring: "Recurring",
    suggestRecurring: "Suggest recurring",
  },
  ta: {
    dashboard: "டாஷ்போர்ட்",
    transactions: "பரிவர்த்தனைகள்",
    subscriptions: "சந்தாக்கள்",
    budgets: "பட்ஜெட்",
    add: "சேர்க்க",
    totalSpent: "மொத்த செலவு",
    income: "வருமானம்",
    net: "மீதி",
    dateRange: "தேதி வரம்பு",
    searchTransactions: "பரிவர்த்தனைகளை தேடு...",
    importCsv: "CSV இறக்குமதி",
    exportCsv: "CSV ஏற்றுமதி",
    recurring: "மீண்டும் மீண்டும்",
    suggestRecurring: "மீண்டும் மீண்டும் சேர்க்கவும்",
  },
}

let currentLocale: Locale = "en"

export function setLocale(locale: Locale) {
  currentLocale = locale
}

export function t(key: string): string {
  return dictionaries[currentLocale][key] ?? key
}

export function getLocale(): Locale {
  return currentLocale
}
