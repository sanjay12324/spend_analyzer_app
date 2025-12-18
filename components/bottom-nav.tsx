"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Receipt, CreditCard, Target, Plus, Menu, TrendingUp, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export default function BottomNav() {
  const pathname = usePathname()

  const mainLinks = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/transactions", icon: Receipt, label: "Transactions" },
    { href: "/dashboard/subscriptions", icon: CreditCard, label: "Subscriptions" },
    { href: "/dashboard/budgets", icon: Target, label: "Budgets" },
  ]

  const menuLinks = [
    { href: "/dashboard/income", icon: TrendingUp, label: "Income Tracking" },
    { href: "/dashboard/profile", icon: User, label: "Profile & Settings" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-6xl mx-auto">
        <Sheet>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                pathname === "/dashboard/income" || pathname === "/dashboard/profile"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Menu className="h-5 w-5" />
              <span className="text-xs font-medium">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>More Options</SheetTitle>
            </SheetHeader>
            <div className="grid gap-3 py-6">
              {menuLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link key={link.href} href={link.href}>
                    <Button variant={isActive ? "default" : "outline"} className="w-full justify-start h-14 text-base">
                      <Icon className="h-5 w-5 mr-3" />
                      {link.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>

        {mainLinks.map((link) => {
          const isActive = pathname === link.href
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
