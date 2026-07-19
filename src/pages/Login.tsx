import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { GraduationCap, ShieldCheck, FlaskConical, ArrowRight, Clock } from "lucide-react"
import { Logo } from "@/components/logo"
import { SSO_ENABLED } from "@/lib/config"

export default function Login() {
  const { loginWithTestAccount } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  // SSO_ENABLED 가 true 가 되면(Keycloak 연동 시) 실제 로그인 경로. 본문만 진짜 SSO 로 교체하면 된다.
  const handleSSO = () => {
    loginWithTestAccount()
    toast({
      title: "로그인했습니다",
      description: "아주대학교 SSO(Keycloak)로 인증되었습니다.",
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
              번거로운 가입 없이.
            </p>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              학교 SSO가 신원을 확인하니 따로 가입할 필요가 없습니다. 연동되면 학교 계정으로 예측·배포까지 곧장 이어집니다.
            </p>
          </div>

          <p className="font-mono text-xs text-muted-foreground">
            아주대학교 아올다(Aolda) 클라우드 위에서 동작합니다
          </p>
        </div>
      </div>

      {/* 우측 카드 */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* 모바일 로고 */}
          <Link to="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
            <Logo className="h-9 w-9" />
            <span className="text-lg font-semibold tracking-tight">launcha</span>
          </Link>

          {SSO_ENABLED ? (
            <>
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
                학교 계정이 곧 로그인입니다 · 별도 가입 없음
              </p>

              <div className="mt-8 flex gap-3 rounded-lg border border-border bg-card p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="text-sm text-muted-foreground">
                  <p className="mb-1 font-medium text-foreground">가입이 따로 없어요</p>
                  아주대학교 SSO가 신원을 확인하므로 별도의 계정 생성·비밀번호가 필요 없습니다. 학교 계정이 곧 로그인입니다.
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight">곧 열려요</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  아주대학교 SSO(Keycloak) 연동을 준비하고 있어요. 그동안 로그인 없이 데모로 전체 흐름을 체험할 수 있습니다.
                </p>
              </div>

              {/* 지금 할 수 있는 primary 액션 = 데모 */}
              <Button asChild size="lg" className="w-full" variant="hero">
                <Link to="/demo">
                  <FlaskConical className="h-4 w-4" /> 데모 둘러보기 <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                로그인 없이 예측 → 검토 → 배포 흐름을 지금 체험해보세요.
              </p>

              {/* 실제 로그인 — 준비 중(비활성) */}
              <div className="my-7 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                아주대 계정 로그인
                <span className="h-px flex-1 bg-border" />
              </div>
              <Button disabled size="lg" className="w-full" variant="outline">
                <GraduationCap className="h-4 w-4" />
                아주대학교 SSO로 로그인
              </Button>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> SSO(Keycloak) 연동 예정 — 현재 로그인은 잠겨 있어요
              </p>
            </>
          )}

          {/* 내부 개발자 진입점 — SSO 연동 전 실 운영 앱 확인용. 계정 아는 사람만 통과. */}
          <p className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            내부 테스트 ·{" "}
            <Link
              to="/dev-login"
              className="underline underline-offset-2 hover:text-foreground"
            >
              개발자 로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
