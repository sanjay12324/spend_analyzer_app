// API Input Validation Helpers
// Use these to validate incoming request data

export function validateAmount(amount: unknown): number {
  const num = Number(amount)
  if (Number.isNaN(num) || num < 0) {
    throw new Error("Invalid amount: must be a positive number")
  }
  return num
}

export function validateDate(date: unknown): string {
  if (typeof date !== "string") {
    throw new Error("Invalid date: must be a string")
  }
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date format")
  }
  return date
}

export function validateString(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") {
    throw new Error("Invalid input: must be a string")
  }
  if (value.length > maxLength) {
    throw new Error(`Input too long: maximum ${maxLength} characters`)
  }
  return value.trim()
}

export function validateEmail(email: unknown): string {
  if (typeof email !== "string") {
    throw new Error("Invalid email: must be a string")
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format")
  }
  return email.toLowerCase().trim()
}

export function validateEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fieldName = "value",
): T {
  if (typeof value !== "string") {
    throw new Error(`Invalid ${fieldName}: must be a string`)
  }
  if (!allowedValues.includes(value as T)) {
    throw new Error(`Invalid ${fieldName}: must be one of ${allowedValues.join(", ")}`)
  }
  return value as T
}

export function sanitizeNote(note: unknown): string | null {
  if (note === null || note === undefined) return null
  if (typeof note !== "string") return null
  
  // Remove potential XSS vectors
  const sanitized = note
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .trim()
  
  return sanitized.substring(0, 1000) // Max 1000 chars
}

export function validateUUID(uuid: unknown): string {
  if (typeof uuid !== "string") {
    throw new Error("Invalid UUID: must be a string")
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(uuid)) {
    throw new Error("Invalid UUID format")
  }
  return uuid.toLowerCase()
}

export function validatePositiveInteger(value: unknown, fieldName = "value"): number {
  const num = Number(value)
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error(`Invalid ${fieldName}: must be a positive integer`)
  }
  return num
}
