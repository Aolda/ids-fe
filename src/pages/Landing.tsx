import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Area, AreaChart, ResponsiveContainer, ReferenceDot, XAxis, YAxis } from "recharts"
import { ArrowRight, Github, Activity, Boxes, BellRing, Terminal } from "lucide-react"

function LandingHeader() {
  const { state } = useAuth()
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">launcha</span>
          <span className="hidden rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
            beta
          </span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#how" className="text-sm text-muted-foreground transition-smooth hover:text-foreground">
            작동 방식
          </a>
          <a href="#pillars" className="text-sm text-muted-foreground transition-smooth hover:text-foreground">
            기능
          </a>
          <a href="#ladder" className="text-sm text-muted-foreground transition-smooth hover:text-foreground">
            리소스 등급
          </a>
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {state.token ? (
            <Button asChild size="sm">
              <Link to="/predict">
                대시보드 <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/login">로그인</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/login">시작하기</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

/* 히어로 우측 제품 미리보기 — 실제 파이프라인(입력→24h 예측→flavor→배포)을 압축해 보여준다 */
const demandCurve = [
  0.28, 0.24, 0.21, 0.19, 0.2, 0.26, 0.35, 0.48, 0.57, 0.61, 0.59, 0.63, 0.68,
  0.66, 0.62, 0.6, 0.64, 0.71, 0.79, 0.86, 0.9, 0.83, 0.62, 0.4,
].map((v, h) => ({ h, score: v }))
const peakIndex = demandCurve.reduce((m, d, i, a) => (d.score > a[m].score ? i : m), 0)

function HeroPreview() {
  return (
    <div className="relative animate-fade-up [animation-delay:120ms]">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lift">
        {/* 카드 헤더 — OS 창 흉내 대신 제품 상태를 보여준다 */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="font-mono text-xs text-muted-foreground">launcha · 예측</span>
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-success">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-success" />
            live
          </span>
        </div>

        <div className="space-y-5 p-5">
          {/* 입력 라인 */}
          <div className="rounded-lg border border-border bg-background/60 p-3">
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <Github className="h-3.5 w-3.5" />
              github.com/team/shop-api
            </div>
            <p className="mt-2 text-sm text-foreground">
              “저녁에 사용자가 몰리는 이벤트용 백엔드. 안정적으로 버텨줬으면 해요.”
            </p>
          </div>

          {/* 24h 예측 곡선 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="eyebrow">리소스 수요 예측 · 24H</span>
              <span className="tabular text-xs text-muted-foreground">
                피크 <span className="text-primary">0.90</span>
              </span>
            </div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={demandCurve} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                  <defs>
                    <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="h" hide />
                  <YAxis hide domain={[0, 1]} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#heroFill)"
                    isAnimationActive={false}
                  />
                  <ReferenceDot
                    x={peakIndex}
                    y={demandCurve[peakIndex].score}
                    r={4}
                    fill="hsl(var(--primary))"
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 결정 + 배포 결과 */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3">
            <div>
              <div className="eyebrow mb-1">추천 등급</div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-primary/10 px-2 py-1 font-mono text-sm font-semibold text-primary">
                  aolda.large
                </span>
                <span className="tabular text-xs text-muted-foreground">4 vCPU · 8 GB</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-success">
              <span className="live-dot h-2 w-2 rounded-full bg-success" />
              배포 완료
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="grid-texture pointer-events-none absolute inset-0 -z-10 opacity-60" />
      <div className="container mx-auto grid items-center gap-14 px-4 py-20 lg:grid-cols-2 lg:py-28">
        <div className="animate-fade-up">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-primary text-primary" />
            <span className="eyebrow text-foreground/80">Intelligent Deployment System</span>
          </div>

          <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            GitHub 주소와 한 문장이면,
            <br />
            배포는 <span className="text-primary">알아서</span> 끝냅니다.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            인프라를 몰라도 됩니다. 자연어 요구사항을 읽고 24시간 수요를 예측해,
            딱 맞는 VM 등급을 <span className="text-foreground">결정론적으로</span> 골라 배포하고
            관측까지 이어갑니다.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="hero">
              <Link to="/login">
                첫 예측 받아보기 <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how">
                <Terminal className="h-4 w-4" /> 작동 방식 보기
              </a>
            </Button>
          </div>

          <p className="mt-8 flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="h-px w-6 bg-border" />
            아주대학교 <span className="text-foreground/70">아올다(Aolda)</span> 클라우드 위에서 동작합니다
          </p>
        </div>

        <HeroPreview />
      </div>
    </section>
  )
}

const steps = [
  {
    no: "01",
    title: "입력",
    body: "GitHub 주소와 한 문장의 요구사항. 그게 전부입니다.",
  },
  {
    no: "02",
    title: "예측",
    body: "저장소를 분석하고 LSTM이 앞으로 24시간의 수요 곡선을 그립니다.",
  },
  {
    no: "03",
    title: "결정",
    body: "예측 피크·맥락·가용량을 규칙으로 계산해 VM 등급을 확정합니다.",
  },
  {
    no: "04",
    title: "배포·관측",
    body: "OpenStack에 배포하고, 이상 징후를 잡아 알려주고, 재추천합니다.",
  },
]

function HowItWorks() {
  return (
    <section id="how" className="border-b border-border py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="mb-14 max-w-2xl">
          <p className="eyebrow mb-3">작동 방식</p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            입력에서 살아있는 서비스까지, 네 단계
          </h2>
          <p className="mt-4 text-muted-foreground">
            사람이 손으로 스펙을 고르지 않습니다. 각 단계는 이전 단계의 사실 위에서 자동으로 이어집니다.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.no} className="group bg-card p-6 transition-smooth hover:bg-elevated">
              <div className="tabular text-sm text-primary">{s.no}</div>
              <div className="seam my-4 w-8 transition-smooth group-hover:w-14" />
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const pillars = [
  {
    icon: Activity,
    title: "피크를 놓치지 않는 예측",
    body: "평균 정확도가 아니라 장애를 부르는 피크에 맞춥니다. 24시간 수요를 예측하고 p90 피크를 기준으로 여유를 잡습니다.",
    tag: "LSTM · 24h",
  },
  {
    icon: Boxes,
    title: "결정론적 등급 결정",
    body: "AI는 요구사항만 해석합니다. VM 등급은 예측·맥락·가용량을 넣는 규칙 함수가 정하므로, 같은 입력이면 언제나 같은 결과입니다.",
    tag: "7단계 ladder",
  },
  {
    icon: BellRing,
    title: "이상 감지와 원인 분석",
    body: "아올다 관측 스택 위에서 배포한 VM을 지켜보다가, 트래픽 급증으로 인한 다운이나 예측을 벗어난 수요 변화(드리프트)를 감지해 원인과 함께 알립니다.",
    tag: "이상탐지 · RCA",
  },
]

function Pillars() {
  return (
    <section id="pillars" className="border-b border-border py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="mb-14 max-w-2xl">
          <p className="eyebrow mb-3">왜 launcha 인가</p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            자동화보다 중요한 건, 틀리지 않는 것
          </h2>
          <p className="mt-4 text-muted-foreground">
            편의보다 신뢰를 먼저 설계했습니다. 예측·결정·관측 각 단계가 검증 가능한 규칙 위에서 움직입니다.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="flex flex-col rounded-xl border border-border bg-card p-6 transition-smooth hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-elevated text-primary">
                  <p.icon className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                  {p.tag}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-semibold">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const ladder = [
  { name: "tiny", cpu: 1, ram: "1GB" },
  { name: "small", cpu: 1, ram: "2GB" },
  { name: "medium", cpu: 2, ram: "4GB" },
  { name: "large", cpu: 4, ram: "8GB" },
  { name: "memory", cpu: 4, ram: "16GB" },
  { name: "xlarge", cpu: 8, ram: "16GB" },
  { name: "max", cpu: 8, ram: "32GB" },
]

function FlavorLadder() {
  return (
    <section id="ladder" className="border-b border-border py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="mb-14 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3">리소스 등급</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              추측이 아니라, 정해진 7단계 사다리
            </h2>
            <p className="mt-4 text-muted-foreground">
              등급은 이 고정 사다리 안에서만 선택됩니다. 임의로 만든 스펙이 새어나가지 않으니, 배포는 늘 예측 가능합니다.
            </p>
          </div>
          <span className="font-mono text-xs text-muted-foreground">tiny → max</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {ladder.map((f, i) => (
            <div
              key={f.name}
              className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 transition-smooth hover:border-primary/50"
            >
              <div
                className="absolute inset-x-0 bottom-0 h-1 bg-primary/70"
                style={{ opacity: 0.25 + (i / (ladder.length - 1)) * 0.75 }}
              />
              <div className="tabular text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</div>
              <div className="mt-2 font-mono text-sm font-semibold text-foreground">aolda.{f.name}</div>
              <div className="mt-3 space-y-0.5 tabular text-xs text-muted-foreground">
                <div>{f.cpu} vCPU</div>
                <div>{f.ram} RAM</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaBand() {
  const { state } = useAuth()
  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-16 text-center">
          <div className="grid-texture pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              배포 스펙, 이제 고민하지 마세요
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              주소 하나와 한 문장으로 첫 예측을 받아보세요. 등급 결정부터 관측까지 launcha가 이어갑니다.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" variant="hero">
                <Link to={state.token ? "/predict" : "/login"}>
                  {state.token ? "대시보드로 이동" : "첫 예측 받아보기"} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <Logo className="h-7 w-7" />
          <span className="font-semibold tracking-tight">launcha</span>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          © 2026 launcha · Ajou University Aolda Cloud
        </p>
      </div>
    </footer>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main>
        <Hero />
        <HowItWorks />
        <Pillars />
        <FlavorLadder />
        <CtaBand />
      </main>
      <LandingFooter />
    </div>
  )
}
