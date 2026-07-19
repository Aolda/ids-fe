import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/logo"
import { API_BASE_URL, DEV_API_OVERRIDE_KEY, REQUEST_TIMEOUT_MS } from "@/lib/config"
import {
  Wrench,
  LogOut,
  ArrowLeft,
  Server,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
} from "lucide-react"

type Ping = "idle" | "checking" | "ok" | "fail"

const read = (k: string) =>
  typeof window !== "undefined" ? window.localStorage.getItem(k) : null

export default function DevConsole() {
  const { state, logout } = useAuth()
  const navigate = useNavigate()

  const [override, setOverride] = useState(read(DEV_API_OVERRIDE_KEY) ?? "")
  const [ping, setPing] = useState<Ping>("idle")

  const devSession = read("ids_dev_session") === "1"
  const activeOverride = read(DEV_API_OVERRIDE_KEY)

  const save = () => {
    const v = override.trim().replace(/\/+$/, "")
    if (v) window.localStorage.setItem(DEV_API_OVERRIDE_KEY, v)
    else window.localStorage.removeItem(DEV_API_OVERRIDE_KEY)
    window.location.reload()
  }

  const reset = () => {
    window.localStorage.removeItem(DEV_API_OVERRIDE_KEY)
    window.location.reload()
  }

  const test = async () => {
    setPing("checking")
    const target = override.trim().replace(/\/+$/, "") || API_BASE_URL
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS)
    try {
      // no-cors: 백엔드가 CORS 를 안 열어도 "도달 가능" 여부는 알 수 있다(opaque 응답=도달).
      await fetch(target, { method: "HEAD", mode: "no-cors", signal: ctrl.signal })
      setPing("ok")
    } catch {
      setPing("fail")
    } finally {
      clearTimeout(t)
    }
  }

  const doLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/predict" className="flex items-center gap-2.5">
            <Logo className="h-8 w-8" />
            <span className="text-lg font-semibold tracking-tight">launcha</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/predict">
              <ArrowLeft className="h-4 w-4" /> 앱으로
            </Link>
          </Button>
        </div>

        <div className="mb-6 flex items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-warning/10 text-warning">
            <Wrench className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">개발자 콘솔</h1>
            <p className="text-xs text-muted-foreground">SSO 연동 전 내부 테스트용</p>
          </div>
        </div>

        {/* 세션 */}
        <section className="mb-4 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">세션</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">계정</dt>
              <dd className="font-mono">{state.email ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">세션 유형</dt>
              <dd>
                {devSession ? (
                  <Badge variant="outline" className="border-warning/30 bg-warning/5 text-warning">
                    개발자 세션
                  </Badge>
                ) : (
                  <Badge variant="outline">일반</Badge>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">토큰</dt>
              <dd className="max-w-[60%] truncate font-mono text-xs text-muted-foreground">
                {state.token ?? "—"}
              </dd>
            </div>
          </dl>
        </section>

        {/* 백엔드 대상 */}
        <section className="mb-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">백엔드 연결</h2>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            공개 백엔드(api.launcha.cloud)가 아직 안 떠 있어서, 배포된 앱에서도 재빌드 없이 백엔드 주소를 바꿔
            로컬·터널 백엔드로 붙여볼 수 있어요. 저장하면 새로고침되며 앱 전체 API 호출이 이 주소로 갑니다.
          </p>

          <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground">현재 대상</span>
            <span className="font-mono text-xs">{API_BASE_URL}</span>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="api-base">백엔드 주소 오버라이드</Label>
            <Input
              id="api-base"
              value={override}
              onChange={(e) => setOverride(e.target.value)}
              placeholder="http://localhost:8000"
              className="font-mono text-sm"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">
              예: <span className="font-mono">http://localhost:8000</span> 또는 ngrok/cloudflared 터널 주소.
              비우고 저장하면 기본값으로 되돌아갑니다.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={save}>
              저장 후 새로고침
            </Button>
            <Button size="sm" variant="outline" onClick={test} disabled={ping === "checking"}>
              {ping === "checking" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Server className="h-4 w-4" />
              )}
              연결 테스트
            </Button>
            {activeOverride && (
              <Button size="sm" variant="ghost" onClick={reset}>
                <RotateCcw className="h-4 w-4" /> 기본값으로
              </Button>
            )}
            {ping === "ok" && (
              <span className="flex items-center gap-1 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" /> 도달 가능
              </span>
            )}
            {ping === "fail" && (
              <span className="flex items-center gap-1 text-sm text-destructive">
                <XCircle className="h-4 w-4" /> 응답 없음
              </span>
            )}
          </div>
        </section>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={doLogout}>
            <LogOut className="h-4 w-4" /> 로그아웃
          </Button>
        </div>
      </div>
    </div>
  )
}
