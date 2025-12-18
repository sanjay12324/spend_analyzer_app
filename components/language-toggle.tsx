"use client"

import { setLocale } from "@/lib/i18n"

export default function LanguageToggle() {
  return (
    <div className="fixed top-2 right-2 z-[60] flex gap-2">
      <button className="px-2 py-1 text-xs rounded border" onClick={() => setLocale("en")}>EN</button>
      <button className="px-2 py-1 text-xs rounded border" onClick={() => setLocale("ta")}>TA</button>
    </div>
  )
}
