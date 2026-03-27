"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9">
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="w-9 h-9 rounded-full hover:bg-surface-hover/20 transition-colors"
    >
      {theme === "light" ? (
        <Sun className="h-[1.2rem] w-[1.2rem] text-text-2" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] text-text-2" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
