import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { GraduationCap, ShieldCheck } from "lucide-react"
import { Logo } from "@/components/logo"

export default function Login() {
  const { loginWithTestAccount } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  // 아주대학교 SSO(Keycloak) — 실제 연동은 팀원이 붙일 seam.
  // 그때까지는 흐름이 끊기지 않도록 데모 세션으로 로그인한다. (handleSSO 본문만 교체하면 됨)
  const handleSSO = () => {
    loginWithTestAccount()
    toast({
      title: "테스트 세션으로 로그인했습니다",
      description: "아주대학교 SSO(Keycloak) 연동은 곧 제공됩니다 (현재는 데모용 세션).",
    })
    navigate("/predict")
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* 좌측 브랜드 패널 (데스크톱) */}
      <div className="relative hidden overflow-hidden border-r border-border bg-card lg:block">
        <div className="aurora pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="h-9 w-9" />
            <span className="text-lg font-semibold tracking-tight">launcha</span>
          </Link>

          <div className="max-w-md">
            <p className="eyebrow mb-4">아주대 구성원 전용</p>
            <p className="text-2xl font-semibold leading-snug tracking-tight">
              아주대 계정 하나로,
              <br />
              바로 시작하세요.
            </p>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              학교 SSO가 신원을 확인하니 따로 가입할 필요가 없습니다. 로그인하면 예측·배포로 곧장 이어집니다.
            </p>
          </div>

          <p className="font-mono text-xs text-muted-foreground">
            아주대학교 아올다(Aolda) 클라우드 위에서 동작합니다
          </p>
        </div>
      </div>

      {/* 우측 SSO 카드 */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* 모바일 로고 */}
          <Link to="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
            <Logo className="h-9 w-9" />
            <span className="text-lg font-semibold tracking-tight">launcha</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">시작하기</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              아주대학교 계정으로 로그인하면 바로 이용할 수 있어요. 별도 가입은 필요 없습니다.
            </p>
          </div>

          <Button onClick={handleSSO} size="lg" className="w-full" variant="hero">
            <GraduationCap className="h-4 w-4" />
            아주대학교 SSO로 로그인
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            현재는 데모 세션으로 로그인됩니다 · SSO(Keycloak) 연동 예정
          </p>

          {/* 왜 가입이 없는지 — 정직한 설명 */}
          <div className="mt-8 flex gap-3 rounded-lg border border-border bg-card p-4">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="text-sm text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">가입이 따로 없어요</p>
              아주대학교 SSO가 신원을 확인하므로 별도의 계정 생성·비밀번호가 필요 없습니다. 학교 계정이 곧 로그인입니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
