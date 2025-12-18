/**
 * Offline-first data persistence
 * Caches data locally and syncs when online
 */

const CACHE_KEYS = {
  expenses: "spend-analyzer:expenses",
  incomes: "spend-analyzer:incomes",
  subscriptions: "spend-analyzer:subscriptions",
  budgets: "spend-analyzer:budgets",
  lastSync: "spend-analyzer:lastSync",
  pendingSync: "spend-analyzer:pendingSync",
} as const

interface PendingSyncItem {
  id: string
  type: "expense" | "income" | "subscription" | "budget"
  action: "create" | "update" | "delete"
  data: any
  timestamp: number
}

export function isBrowser(): boolean {
  return typeof window !== "undefined"
}

export function cacheData<T>(key: keyof typeof CACHE_KEYS, data: T): void {
  if (!isBrowser()) return
  try {
    localStorage.setItem(CACHE_KEYS[key], JSON.stringify(data))
  } catch (e) {
    console.warn("[Offline] Failed to cache data:", e)
  }
}

export function getCachedData<T>(key: keyof typeof CACHE_KEYS): T | null {
  if (!isBrowser()) return null
  try {
    const data = localStorage.getItem(CACHE_KEYS[key])
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.warn("[Offline] Failed to get cached data:", e)
    return null
  }
}

export function clearCache(key: keyof typeof CACHE_KEYS): void {
  if (!isBrowser()) return
  try {
    localStorage.removeItem(CACHE_KEYS[key])
  } catch (e) {
    console.warn("[Offline] Failed to clear cache:", e)
  }
}

export function addPendingSync(item: Omit<PendingSyncItem, "id" | "timestamp">): void {
  if (!isBrowser()) return
  try {
    const pending = getCachedData<PendingSyncItem[]>("pendingSync") || []
    const newItem: PendingSyncItem = {
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    }
    pending.push(newItem)
    cacheData("pendingSync", pending)
  } catch (e) {
    console.warn("[Offline] Failed to add pending sync:", e)
  }
}

export function getPendingSync(): PendingSyncItem[] {
  return getCachedData<PendingSyncItem[]>("pendingSync") || []
}

export function clearPendingSync(): void {
  clearCache("pendingSync")
}

export function getLastSyncTime(): number {
  if (!isBrowser()) return 0
  try {
    const time = localStorage.getItem(CACHE_KEYS.lastSync)
    return time ? Number.parseInt(time) : 0
  } catch {
    return 0
  }
}

export function setLastSyncTime(): void {
  if (!isBrowser()) return
  try {
    localStorage.setItem(CACHE_KEYS.lastSync, Date.now().toString())
  } catch (e) {
    console.warn("[Offline] Failed to set sync time:", e)
  }
}

export function isOnline(): boolean {
  if (!isBrowser()) return true
  return navigator.onLine
}

export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  if (!isBrowser()) return () => {}

  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener("online", handleOnline)
  window.addEventListener("offline", handleOffline)

  return () => {
    window.removeEventListener("online", handleOnline)
    window.removeEventListener("offline", handleOffline)
  }
}
