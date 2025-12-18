import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-balance bg-gradient-to-br from-primary via-accent to-primary bg-clip-text text-transparent">
            Spend Analyzer
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground text-balance">
            Track daily expenses, subscriptions, and budgets with multilingual support
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="h-14 px-8 text-lg">
            <Link href="/auth/sign-up">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg bg-transparent">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
          <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border">
            <h3 className="font-semibold text-lg mb-2">Smart Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Daily, weekly, and monthly recurring expenses with OCR support
            </p>
          </div>
          <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border">
            <h3 className="font-semibold text-lg mb-2">Subscriptions</h3>
            <p className="text-sm text-muted-foreground">Manage paid and free-tier subscriptions with reminders</p>
          </div>
          <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border">
            <h3 className="font-semibold text-lg mb-2">Analytics</h3>
            <p className="text-sm text-muted-foreground">Detailed insights with budgets and spending trends</p>
          </div>
        </div>
      </div>
    </div>
  )
}
