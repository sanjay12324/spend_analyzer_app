/**
 * In-app notification system
 * Manages toast notifications for user feedback
 */

export type NotificationType = "success" | "error" | "warning" | "info"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  description?: string
  duration?: number
}

// Global notification listeners
const listeners: Set<(notification: Notification) => void> = new Set()

export function subscribeToNotifications(callback: (notification: Notification) => void): () => void {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function notifyAll(notification: Notification) {
  listeners.forEach((callback) => callback(notification))
}

export function showNotification(
  type: NotificationType,
  title: string,
  description?: string,
  duration: number = 3000,
): string {
  const id = `${Date.now()}-${Math.random()}`
  const notification: Notification = {
    id,
    type,
    title,
    description,
    duration,
  }

  notifyAll(notification)

  if (duration > 0) {
    setTimeout(() => {
      removeNotification(id)
    }, duration)
  }

  return id
}

export function removeNotification(id: string): void {
  notifyAll({ id, type: "info", title: "", description: undefined })
}

// Convenience methods
export const Notification = {
  success: (title: string, description?: string) => showNotification("success", title, description),
  error: (title: string, description?: string) => showNotification("error", title, description),
  warning: (title: string, description?: string) => showNotification("warning", title, description),
  info: (title: string, description?: string) => showNotification("info", title, description),
}
