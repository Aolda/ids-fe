import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { Mail, ShieldCheck, Sun, Moon, Monitor, Check } from "lucide-react"

function Section({
  title,
  desc,
  children,
}: {
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5">
        <h2 className="font-semibold">{title}</h2>
        {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {children}
    </section>
  )
}

function Row({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className={cn("text-sm text-foreground", mono && "font-mono")}>{value}</span>
    </div>
  )
}

const themes: { key: "light" | "dark" | "system"; label: string; icon: React.ElementType; desc: string }[] = [
  { key: "light", label: "라이트", icon: Sun, desc: "밝고 선명한 화면" },
  { key: "dark", label: "다크", icon: Moon, desc: "어두운 환경에 적합" },
  { key: "system", label: "시스템", icon: Monitor, desc: "OS 설정을 따름" },
]

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { state } = useAuth()

  const email = state.email ?? "—"

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">설정</h1>
          <p className="mt-1 text-sm text-muted-foreground">계정과 화면 설정을 관리하세요.</p>
        </div>

        <div className="space-y-6">
          {/* 계정 */}
          <Section title="계정" desc="아주대학교 SSO로 인증된 계정입니다.">
            <div>
              <Row icon={Mail} label="이메일" mono value={email} />
            </div>
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              아주대학교 SSO가 신원을 확인합니다. 비밀번호는 저장하지 않으며, 별도 가입도 없습니다.
            </div>
          </Section>

          {/* 화면 */}
          <Section title="화면" desc="테마를 선택하면 즉시 적용됩니다.">
            <div className="grid gap-3 sm:grid-cols-3">
              {themes.map((t) => {
                const active = theme === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => setTheme(t.key)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
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
          </Section>
        </div>
      </div>
    </div>
  )
}
