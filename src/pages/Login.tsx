import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { authApi } from "@/lib/authAPI"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowRight, GraduationCap } from "lucide-react"
import { Logo } from "@/components/logo"

export default function Login() {
  const { login, loginWithTestAccount } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await authApi.login(email, password)
      login(res.access_token, email)
      navigate("/predict")
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  // 아주대학교 SSO — 인증서 연동은 팀원이 붙일 seam.
  // 그때까지는 랜딩→로그인→대시보드 흐름이 끊기지 않도록 테스트 세션으로 로그인한다.
  const handleSSO = () => {
    loginWithTestAccount()
    toast({
      title: "테스트 세션으로 로그인했습니다",
      description: "아주대학교 SSO 인증서 연동은 곧 제공됩니다 (현재는 데모용 세션).",
    })
    navigate("/predict")
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* 좌측 브랜드 패널 (데스크톱) */}
      <div className="grain relative hidden overflow-hidden border-r border-border bg-card lg:block">
        <div className="aurora pointer-events-none absolute inset-0" />
        <div className="grid-texture pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="h-9 w-9" />
            <span className="text-lg font-semibold tracking-tight">launcha</span>
          </Link>

          <div className="max-w-md">
            <p className="eyebrow mb-4">Intelligent Deployment System</p>
            <p className="text-2xl font-semibold leading-snug tracking-tight">
              GitHub 주소와 한 문장이면,
              <br />
              배포는 <span className="text-primary">알아서</span> 끝냅니다.
            </p>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              24시간 수요를 예측하고, 딱 맞는 VM 등급을 결정론적으로 골라 배포·관측까지 이어가는 배포 보조 서비스.
            </p>
          </div>

          <p className="font-mono text-xs text-muted-foreground">
            아주대학교 아올다(Aolda) 클라우드 위에서 동작합니다
          </p>
        </div>
      </div>

      {/* 우측 인증 카드 */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* 모바일 로고 */}
          <Link to="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
            <Logo className="h-9 w-9" />
            <span className="text-lg font-semibold tracking-tight">launcha</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">다시 오신 걸 환영합니다</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              계정에 로그인하고 예측·배포를 시작하세요.
            </p>
          </div>

          {/* 주 인증 경로 — 아주대 SSO */}
          <Button onClick={handleSSO} size="lg" className="w-full" variant="hero">
            <GraduationCap className="h-4 w-4" />
            아주대학교 SSO로 로그인
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            현재는 데모 세션으로 로그인됩니다 · SSO 연동 예정
          </p>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">또는 이메일</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@ajou.ac.kr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" variant="outline" className="w-full" disabled={isLoading}>
              {isLoading ? "로그인 중..." : "이메일로 로그인"}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            계정이 없으신가요?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
