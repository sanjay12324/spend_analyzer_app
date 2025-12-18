"use client"

import { useNotifications } from "@/hooks/use-notifications"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function NotificationCenter() {
  const notifications = useNotifications()

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5" />
      case "error":
        return <AlertCircle className="h-5 w-5" />
      case "warning":
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getStyles = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
      case "error":
        return "bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-200 border-red-200 dark:border-red-800"
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800"
      default:
        return "bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800"
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg border pointer-events-auto animate-in slide-in-from-top fade-in",
            getStyles(notification.type),
          )}
        >
          <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
          <div className="flex-1">
            <p className="font-medium text-sm">{notification.title}</p>
            {notification.description && <p className="text-xs mt-1 opacity-90">{notification.description}</p>}
          </div>
          <button
            className="flex-shrink-0 ml-2 opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => {
              // Auto-dismiss handled by notification system
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
