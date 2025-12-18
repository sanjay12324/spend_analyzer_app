"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ReceiptOCR({ onParsed }: { onParsed: (result: { amount?: number; lines: string[] }) => void }) {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [lines, setLines] = useState<string[]>([])

  const handleFile = async (file: File) => {
    try {
      // Lazy import to reduce bundle size
      const Tesseract = await import("tesseract.js")
      const { data } = await Tesseract.recognize(file, "eng", { logger: () => {} })
      const text = data.text || ""
      const parsedLines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
      setLines(parsedLines)

      // Naive amount extraction: find the largest number with decimal
      const amounts = Array.from(text.matchAll(/\b(\d{1,3}(?:[,\s]\d{2,3})*(?:\.\d{1,2})?)\b/g)).map((m) => {
        const num = Number(m[1].replace(/[\s,]/g, ""))
        return isNaN(num) ? 0 : num
      })
      const amount = amounts.length ? Math.max(...amounts) : undefined

      onParsed({ amount, lines: parsedLines })
      toast({ title: "Receipt parsed", description: amount ? `Detected amount: ₹${amount.toFixed(0)}` : "No amount detected" })
    } catch (e: any) {
      toast({ title: "OCR failed", description: e?.message || "Unable to parse receipt", variant: "destructive" })
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            if (fileRef.current) fileRef.current.value = ""
          }}
        />
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload className="h-5 w-5 mr-2" />
          Upload Receipt Image
        </Button>
        {lines.length > 0 && (
          <div className="text-xs text-muted-foreground max-h-48 overflow-auto whitespace-pre-wrap">
            {lines.join("\n")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
