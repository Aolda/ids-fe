import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/contexts/AuthContext"
import { authApi, UserProfile } from "@/lib/authAPI"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Mail, Calendar, ShieldCheck, Sun, Moon, Monitor, Trash2, Check } from "lucide-react"

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

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { state, logout } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      if (!state.token) {
        setIsLoading(false)
        return
      }
      try {
        setProfile(await authApi.getProfile(state.token))
      } catch (err) {
        // 백엔드 미가동 등 — 세션 email 로 폴백 표시(토스트 억제).
        console.warn("프로필 로드 실패", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
  }, [state.token])

  const handleDeleteAccount = async () => {
    if (!state.token) return
    setIsDeleting(true)
    try {
      await authApi.deleteAccount(state.token)
      toast({ title: "계정 삭제 완료", description: "계정 데이터가 삭제되었습니다." })
      logout()
      navigate("/login")
    } catch (err) {
      toast({
        title: "계정 삭제 실패",
        description: err instanceof Error ? err.message : "계정 삭제에 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const email = profile?.email ?? state.email ?? "—"

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
              <Row
                icon={Mail}
                label="이메일"
                mono
                value={isLoading ? <Skeleton className="h-4 w-40" /> : email}
              />
              {profile?.created_at && (
                <Row icon={Calendar} label="가입일" value={formatDate(profile.created_at)} />
              )}
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

          {/* 위험 구역 */}
          <Section title="위험 구역" desc="되돌릴 수 없는 작업입니다.">
            <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium">계정 데이터 삭제</div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  계정과 관련된 모든 데이터가 영구적으로 삭제됩니다.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting} className="shrink-0">
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? "삭제 중…" : "삭제"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>정말 삭제할까요?</AlertDialogTitle>
                    <AlertDialogDescription>
                      되돌릴 수 없습니다. 계정과 모든 관련 데이터가 영구적으로 삭제됩니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      삭제
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
