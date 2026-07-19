import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Logo } from "@/components/logo"
import { AlertCircle, Wrench } from "lucide-react"

// 내부 테스트용 개발자 로그인 — SSO(Keycloak) 준비 전까지 실 운영 앱을 확인하기 위한 임시 진입점.
// 실제 인증이 아니라 클라이언트 세션만 만든다(백엔드는 IDS_API_TOKEN 으로 별도 보호). SSO 붙으면 제거한다.
const DEV_EMAIL = "jinhopm@ids.kr"
const DEV_PASSWORD = "demo1234"

export default function DevLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim() === DEV_EMAIL && password === DEV_PASSWORD) {
      localStorage.setItem("ids_dev_session", "1")
      login("dev_session_" + email.trim(), email.trim())
      navigate("/predict")
    } else {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Logo className="h-9 w-9" />
          <span className="text-lg font-semibold tracking-tight">launcha</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-warning/10 text-warning">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <h1 className="font-semibold">개발자 로그인</h1>
              <p className="text-xs text-muted-foreground">내부 테스트용 · 실 운영 앱 접근</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dev-email">이메일</Label>
              <Input
                id="dev-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                placeholder="you@ids.kr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dev-password">비밀번호</Label>
              <Input
                id="dev-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full">
              로그인
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
          일반 사용자는{" "}
          <Link to="/login" className="text-primary hover:underline">
            아주대 SSO
          </Link>
          로 로그인합니다. 이 화면은 SSO 연동 전 내부 테스트용이에요.
        </p>
      </div>
    </div>
  )
}
