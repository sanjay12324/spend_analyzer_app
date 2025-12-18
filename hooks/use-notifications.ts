import { useEffect, useState } from "react"
import { subscribeToNotifications, type Notification } from "@/lib/notifications"

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((notification) => {
      if (notification.title === "" && notification.description === undefined) {
        // Remove notification
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
      } else {
        // Add or update notification
        setNotifications((prev) => [
          ...prev.filter((n) => n.id !== notification.id),
          notification,
        ])
      }
    })

    return unsubscribe
  }, [])

  return notifications
}
