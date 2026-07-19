import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { FlaskConical, Sun, Moon, Monitor, Check } from "lucide-react"

const themes: { key: "light" | "dark" | "system"; label: string; icon: React.ElementType; desc: string }[] = [
  { key: "light", label: "라이트", icon: Sun, desc: "밝고 선명한 화면" },
  { key: "dark", label: "다크", icon: Moon, desc: "어두운 환경에 적합" },
  { key: "system", label: "시스템", icon: Monitor, desc: "OS 설정을 따름" },
]

export default function DemoSettings() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">설정</h1>
          <p className="mt-1 text-sm text-muted-foreground">데모 환경의 화면 설정입니다.</p>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold">계정</h2>
            <p className="mt-1 text-sm text-muted-foreground">데모 세션으로 동작 중입니다.</p>
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
              <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              데모에는 로그인이 없습니다. 실제 서비스는 아주대학교 SSO(Keycloak)로 인증하며, 연동되면 학교 계정으로 바로
              이용할 수 있어요.
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <div className="mb-5">
              <h2 className="font-semibold">화면</h2>
              <p className="mt-1 text-sm text-muted-foreground">테마를 선택하면 즉시 적용됩니다.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {themes.map((t) => {
                const active = theme === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => setTheme(t.key)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <t.icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                      {active && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="mt-3 font-medium">{t.label}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{t.desc}</div>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
