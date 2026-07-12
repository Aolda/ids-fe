import { useTheme } from "@/components/theme-provider"
import { Moon, Sun } from "lucide-react"

/* 라이트/다크 토글 — 랜딩과 앱 네비가 같은 컨트롤을 공유한다. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="테마 전환"
      className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-smooth hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
