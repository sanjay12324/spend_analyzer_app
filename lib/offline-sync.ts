// Offline sync utilities using IndexedDB
const DB_NAME = "spend_analyzer_db"
const DB_VERSION = 1
const EXPENSES_STORE = "pending_expenses"

export interface PendingExpense {
  id: string
  data: any
  timestamp: number
  synced: boolean
}

// Initialize IndexedDB
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(EXPENSES_STORE)) {
        const store = db.createObjectStore(EXPENSES_STORE, { keyPath: "id" })
        store.createIndex("synced", "synced", { unique: false })
        store.createIndex("timestamp", "timestamp", { unique: false })
      }
    }
  })
}

// Add expense to pending queue
export async function addPendingExpense(data: any): Promise<string> {
  const db = await initDB()
  const id = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EXPENSES_STORE], "readwrite")
    const store = transaction.objectStore(EXPENSES_STORE)

    const expense: PendingExpense = {
      id,
      data,
      timestamp: Date.now(),
      synced: false,
    }

    const request = store.add(expense)
    request.onsuccess = () => resolve(id)
    request.onerror = () => reject(request.error)
  })
}

// Get all pending expenses
export async function getPendingExpenses(): Promise<PendingExpense[]> {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EXPENSES_STORE], "readonly")
    const store = transaction.objectStore(EXPENSES_STORE)
    const index = store.index("synced")
    const request = index.getAll(false)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Mark expense as synced
export async function markAsSynced(id: string): Promise<void> {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EXPENSES_STORE], "readwrite")
    const store = transaction.objectStore(EXPENSES_STORE)
    const request = store.get(id)

    request.onsuccess = () => {
      const expense = request.result
      if (expense) {
        expense.synced = true
        store.put(expense)
      }
      resolve()
    }
    request.onerror = () => reject(request.error)
  })
}

// Sync all pending expenses
export async function syncPendingExpenses(syncFn: (data: any) => Promise<void>): Promise<number> {
  const pending = await getPendingExpenses()
  let synced = 0

  for (const expense of pending) {
    try {
      await syncFn(expense.data)
      await markAsSynced(expense.id)
      synced++
    } catch (error) {
      console.error("Failed to sync expense:", error)
    }
  }

  return synced
}

// Check if online
export function isOnline(): boolean {
  return navigator.onLine
}

// Setup online/offline listeners
export function setupOnlineListeners(onOnline: () => void, onOffline: () => void): () => void {
  window.addEventListener("online", onOnline)
  window.addEventListener("offline", onOffline)

  return () => {
    window.removeEventListener("online", onOnline)
    window.removeEventListener("offline", onOffline)
  }
}
