import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, ShieldAlert, HelpCircle, Github, Sparkles, ArrowRight, Loader2, Circle } from "lucide-react"
import { PredictResponse } from "@/lib/backendAPI"
import { cn } from "@/lib/utils"

// 비전문 사용자의 '빈 칸' 부담을 덜어주는 예시 프리셋 — 클릭하면 자연어 요구사항을 채운다.
const EXAMPLES: { label: string; text: string }[] = [
  { label: "가벼운 웹서버", text: "간단한 개인 웹사이트예요. 하루 방문자 100명 안팎이고 특별한 피크는 없습니다." },
  { label: "팀 API 서버", text: "백엔드 API 서버입니다. 동시 사용자 500명 정도이고 평일 오후에 트래픽이 몰려요." },
  { label: "출시 이벤트", text: "출시 이벤트로 잠깐 수천 명이 몰릴 수 있어요. 피크에도 절대 느려지면 안 됩니다." },
  { label: "DB·캐시", text: "데이터베이스/캐시 용도라 메모리가 넉넉해야 하고 안정성이 중요합니다." },
]

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // 예측(읽기 전용) — 자연어 → flavor/부하/자동화 게이트. 배포하지 않는다.
  onPredict: (data: ProjectData) => Promise<PredictResponse>
  // 배포(변경) — 예측을 확인한 뒤에만 호출. 게이트가 auto/manual 일 때만 노출된다.
  onDeploy: (data: ProjectData, predict: PredictResponse) => Promise<void>
}

export interface ProjectData {
  github_repo_url: string
  requirements: string // 자연어 요청사항
}

type Gate = "auto" | "manual" | "block"

// automation_mode(rubric S10) → 검토 화면 배너 스펙.
const gateMeta: Record<Gate, { icon: React.ElementType; title: string; cls: string; iconCls: string }> = {
  auto: {
    icon: CheckCircle2,
    title: "자동 배포 준비 완료",
    cls: "border-success/30 bg-success/5",
    iconCls: "text-success",
  },
  manual: {
    icon: ShieldAlert,
    title: "배포 전 검토가 필요해요",
    cls: "border-warning/30 bg-warning/5",
    iconCls: "text-warning",
  },
  block: {
    icon: AlertCircle,
    title: "이 조건으로는 배포할 수 없어요",
    cls: "border-destructive/30 bg-destructive/5",
    iconCls: "text-destructive",
  },
}

// automation_mode(rubric S10) 정규화 — fail-safe. 인식 못 하는/누락/대소문자 다른 값은
// 절대 자동배포로 흘리지 않고 manual(명시 승인 필요)로 강등한다. 백엔드 block 은 그대로 block.
function resolveGate(raw: string | null | undefined): Gate {
  const v = String(raw ?? "").toLowerCase()
  if (v === "auto" || v === "manual" || v === "block") return v
  return "manual"
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-sm text-foreground">{value}</div>
    </div>
  )
}

// 실제 파이프라인 단계 — 예측/배포가 도는 동안 "뭘 하고 있는지"를 순차로 보여준다.
// 데모에선 합성 지연으로, 실제 앱에선 진짜 요청이 도는 동안 애니메이션된다(마지막 단계 유지).
const PREDICT_STEPS = [
  "저장소 분석 (Dockerfile · 포트 · 의존성)",
  "요구사항 해석 (자연어 → 컨텍스트)",
  "24시간 부하 예측 (LSTM)",
  "최적 VM 등급 결정",
]
const DEPLOY_STEPS = ["배포 계획 검증", "OpenStack VM 프로비저닝", "네트워크 · cloud-init 설정"]

function ProcessingView({ steps, stepMs = 750 }: { steps: string[]; stepMs?: number }) {
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 1; i < steps.length; i++) {
      timers.push(setTimeout(() => setCurrent(i), i * stepMs))
    }
    return () => timers.forEach(clearTimeout)
  }, [steps, stepMs])
  return (
    <div className="space-y-3.5 py-8">
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={s} className="flex items-center gap-3">
            {done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
            ) : active ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-muted-foreground/30" />
            )}
            <span
              className={cn(
                "text-sm",
                done
                  ? "text-muted-foreground"
                  : active
                    ? "font-medium text-foreground"
                    : "text-muted-foreground/50",
              )}
            >
              {s}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function CreateProjectDialog({ open, onOpenChange, onPredict, onDeploy }: CreateProjectDialogProps) {
  const [formData, setFormData] = useState<ProjectData>({
    github_repo_url: "",
    requirements: "",
  })
  const [step, setStep] = useState<"input" | "review">("input")
  const [predict, setPredict] = useState<PredictResponse | null>(null)
  const [error, setError] = useState("")
  const [isPredicting, setIsPredicting] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)

  const reset = () => {
    setFormData({ github_repo_url: "", requirements: "" })
    setStep("input")
    setPredict(null)
    setError("")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const fillExample = (text: string) => {
    setFormData((prev) => ({ ...prev, requirements: text }))
  }

  // 1단계: 예측만. 결과의 게이트/되묻기를 보고 사용자가 배포를 결정한다.
  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsPredicting(true)
    try {
      const result = await onPredict(formData)
      setPredict(result)
      setStep("review")
    } catch (err) {
      setError(err instanceof Error ? err.message : "예측에 실패했습니다.")
    } finally {
      setIsPredicting(false)
    }
  }

  // 2단계: 게이트가 배포를 허용할 때만 호출된다(block 에서는 버튼 자체가 없음).
  const handleDeploy = async () => {
    if (!predict) return
    setError("")
    setIsDeploying(true)
    try {
      await onDeploy(formData, predict)
      reset()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "배포에 실패했습니다.")
    } finally {
      setIsDeploying(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    // 진행 중(예측·배포)엔 닫기(ESC/바깥클릭/X)를 막는다 — 늦게 끝난 요청이 재입력을 덮거나
    // 닫힌 뒤 stale review 로 튀는 레이스, 배포를 ESC 로 취소한 듯 보이지만 VM 은 생성되는 오인을 방지.
    if (!next && (isPredicting || isDeploying)) return
    if (!next) reset()
    onOpenChange(next)
  }

  const gate: Gate = resolveGate(predict?.automation_mode)
  const gm = gateMeta[gate] ?? gateMeta.auto
  const reasons = predict?.recommendations?.notes ?? null
  const question = predict?.question ?? null
  const missing = predict?.missing_fields ?? []
  const flavor = predict?.recommendations?.flavor ?? null
  const cost = predict?.recommendations?.cost_per_day ?? null
  const ctx = predict?.extracted_context
  const series = predict?.predictions_24h ?? predict?.predictions?.values_24h ?? []
  const peak = Array.isArray(series) && series.length ? Math.max(...series) : null
  const peakPct = peak != null ? Math.round(peak * 100) : null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        {step === "input" ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0 text-left">
                  <DialogTitle className="text-base">새 배포 예측</DialogTitle>
                  <DialogDescription className="mt-0.5">
                    GitHub 주소와 한 문장이면 충분해요. 결과를 확인한 뒤 배포합니다.
                  </DialogDescription>
                </div>
              </div>
              {/* 3단계 흐름 — 지금 어디쯤인지 알려준다 */}
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="font-medium text-primary">1 · 입력</span>
                <span className="h-px flex-1 bg-border" />
                <span className="text-muted-foreground">2 · 검토</span>
                <span className="h-px flex-1 bg-border" />
                <span className="text-muted-foreground">3 · 배포</span>
              </div>
            </DialogHeader>
            <form onSubmit={handlePredict}>
              {isPredicting ? (
                <ProcessingView steps={PREDICT_STEPS} />
              ) : (
                <>
              <div className="space-y-5 py-4">
                <div className="space-y-2">
                  <Label htmlFor="github_repo_url">GitHub 저장소</Label>
                  <div className="relative">
                    <Github className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="github_repo_url"
                      name="github_repo_url"
                      type="url"
                      placeholder="github.com/username/repo"
                      value={formData.github_repo_url}
                      onChange={handleChange}
                      required
                      disabled={isPredicting}
                      className="pl-9 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirements">어떤 서비스인가요?</Label>
                  <Textarea
                    id="requirements"
                    name="requirements"
                    placeholder="예: 예상 사용자 100명 안팎, 평일 오후 2~4시에 트래픽이 몰려요. 잠깐이라도 느려지면 안 됩니다."
                    value={formData.requirements}
                    onChange={handleChange}
                    required
                    disabled={isPredicting}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-xs text-muted-foreground">예시로 채우기</span>
                    {EXAMPLES.map((ex) => (
                      <button
                        key={ex.label}
                        type="button"
                        onClick={() => fillExample(ex.text)}
                        disabled={isPredicting}
                        className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-smooth hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                      >
                        {ex.label}
                      </button>
                    ))}
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPredicting}>
                  취소
                </Button>
                <Button type="submit" disabled={isPredicting}>
                  {isPredicting ? (
                    "예측 중…"
                  ) : (
                    <>
                      예측하기 <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </DialogFooter>
                </>
              )}
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>예측 결과 검토</DialogTitle>
              <DialogDescription>추천 스펙과 자동화 판정을 확인하고 배포를 진행하세요.</DialogDescription>
            </DialogHeader>
            {isDeploying ? (
              <ProcessingView steps={DEPLOY_STEPS} />
            ) : (
              <>
            <div className="space-y-4 py-4">
              {/* 자동화 게이트 배너 */}
              <div className={cn("flex items-start gap-2.5 rounded-lg border p-3 text-sm", gm.cls)}>
                <gm.icon className={cn("mt-0.5 h-4 w-4 shrink-0", gm.iconCls)} />
                <div>
                  <p className="font-medium text-foreground">{gm.title}</p>
                  {reasons && <p className="mt-1 text-muted-foreground">{reasons}</p>}
                </div>
              </div>

              {/* 되묻기 — 추출이 부족할 때 더 정확한 예측을 위한 질문 */}
              {question && (
                <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">조금 더 알려주시면 정확해져요</p>
                    <p className="mt-1 text-muted-foreground">{question}</p>
                  </div>
                </div>
              )}

              {/* 추천 요약 */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">추천 스펙</span>
                  <Badge variant="outline" className="font-mono">
                    {flavor ?? "미확정"}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Stat label="예상 피크 부하" value={peakPct != null ? `${peakPct}%` : "—"} />
                  <Stat
                    label="예상 사용자"
                    value={ctx?.expected_users ? ctx.expected_users.toLocaleString() : "—"}
                  />
                  <Stat label="시간대" value={ctx?.time_slot ?? "—"} />
                  <Stat
                    label="현재 vCPU / MEM"
                    value={ctx ? `${ctx.curr_cpu} / ${ctx.curr_mem}MB` : "—"}
                  />
                  <Stat label="예상 비용" value={cost != null ? `$${cost}/day` : "—"} />
                </div>
                {missing.length > 0 && (
                  <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                    부족한 정보: {missing.join(", ")}
                  </p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setError("")
                  setStep("input")
                }}
                disabled={isDeploying}
              >
                {question || gate === "block" ? "요구사항 보완" : "다시 입력"}
              </Button>
              {gate !== "block" && (
                <Button type="button" onClick={handleDeploy} disabled={isDeploying}>
                  {isDeploying ? "배포 중…" : gate === "manual" ? "승인하고 배포" : "배포하기"}
                </Button>
              )}
            </DialogFooter>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
