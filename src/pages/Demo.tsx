import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { CreateProjectDialog, ProjectData } from "@/components/CreateProjectDialog"
import { DeploymentSummaryDialog, DeploymentSummaryData } from "@/components/DeploymentSummaryDialog"
import { PredictResponse } from "@/lib/backendAPI"
import { DeployResponse, Project } from "@/lib/mcpAPI"
import { cn } from "@/lib/utils"
import { Github, Plus, ExternalLink, ArrowRight, FlaskConical } from "lucide-react"

// ── 더미 데이터 ─────────────────────────────────────────────
const SEED_PROJECTS: Project[] = [
  {
    id: 1,
    name: "shop-api",
    repository: "https://github.com/team/shop-api",
    status: "deployed",
    last_deployment: "2026-07-19T14:20:00Z",
    url: "https://shop-api.aolda.dev",
    instance_id: "vm-8a21",
  },
  {
    id: 2,
    name: "portfolio-web",
    repository: "https://github.com/jane/portfolio-web",
    status: "deployed",
    last_deployment: "2026-07-18T09:10:00Z",
    url: null,
    instance_id: "vm-4c07",
  },
  {
    id: 3,
    name: "ml-batch",
    repository: "https://github.com/lab/ml-batch",
    status: "building",
    last_deployment: "2026-07-20T00:05:00Z",
    url: null,
    instance_id: "vm-1f93",
  },
]

const statusMeta: Record<Project["status"], { label: string; cls: string }> = {
  deployed: { label: "배포됨", cls: "bg-success/10 text-success border-success/20" },
  building: { label: "빌드 중", cls: "bg-primary/10 text-primary border-primary/20" },
  error: { label: "오류", cls: "bg-destructive/10 text-destructive border-destructive/20" },
  stopped: { label: "중지됨", cls: "bg-muted text-muted-foreground border-border" },
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

// 입력 자연어로 그럴듯한 예측을 합성 — 백엔드 없이 검토 화면을 실제처럼 보여준다.
function synthPredict(data: ProjectData): PredictResponse {
  const text = data.requirements.toLowerCase()
  const heavy = /수천|수만|이벤트|출시|피크|몰|고가용|많|db|데이터베이스|캐시/.test(text)
  const light = /개인|간단|가벼|작|소규모/.test(text)
  const users = heavy ? 3000 : light ? 80 : 500
  const flavor = heavy ? "aolda.xlarge" : light ? "aolda.small" : "aolda.medium"
  const gate: "auto" | "manual" = heavy ? "manual" : "auto"
  const peak = heavy ? 0.86 : light ? 0.32 : 0.61
  const cost = heavy ? 6.4 : light ? 0.9 : 2.8
  const curr_cpu = heavy ? 8 : light ? 1 : 2
  const curr_mem = heavy ? 16384 : light ? 2048 : 4096
  const series = Array.from({ length: 24 }, (_, i) => {
    const v = 0.15 + (peak - 0.15) * Math.sin((i / 23) * Math.PI)
    return Number(Math.max(0, Math.min(1, v)).toFixed(3))
  })
  return {
    success: true,
    github_info: {},
    extracted_context: {
      service_type: /api|백엔드|서버/.test(text) ? "api" : /db|데이터|캐시/.test(text) ? "db" : "web",
      expected_users: users,
      time_slot: heavy ? "peak" : "normal",
      runtime_env: "prod",
      curr_cpu,
      curr_mem,
      reasoning: "데모 · 입력 문장에서 규모와 피크를 추정한 합성 예측입니다.",
    },
    predictions: { values_24h: series },
    recommendations: {
      flavor,
      cost_per_day: cost,
      notes:
        gate === "manual"
          ? "피크 수요가 커서 자동배포 전 검토를 권장합니다 (데모)."
          : "예상 부하가 단일 VM 여유 안에 들어옵니다 (데모).",
    },
    automation_mode: gate,
    extraction_status: "complete",
    context_confidence: 0.9,
    missing_fields: [],
    question: null,
    predictions_24h: series,
  }
}

export default function Demo() {
  const [projects, setProjects] = useState<Project[]>(SEED_PROJECTS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [summary, setSummary] = useState<DeploymentSummaryData | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)

  const onPredict = async (data: ProjectData): Promise<PredictResponse> => {
    await new Promise((r) => setTimeout(r, 650)) // '예측 중…' 상태를 보여주기 위한 지연
    return synthPredict(data)
  }

  const onDeploy = async (data: ProjectData, predict: PredictResponse): Promise<void> => {
    await new Promise((r) => setTimeout(r, 700))
    const slug = data.github_repo_url.replace(/\/$/, "").split("/").pop() || "new-service"
    const instance_id = `vm-demo${String(projects.length + 1).padStart(2, "0")}`
    const newProject: Project = {
      id: Date.now(),
      name: slug,
      repository: data.github_repo_url,
      status: "deployed",
      last_deployment: new Date().toISOString(),
      url: null,
      instance_id,
    }
    setProjects((prev) => [newProject, ...prev.filter((p) => p.repository !== data.github_repo_url)])
    const deployResult: DeployResponse = {
      accepted: true,
      message: "데모 배포가 완료됐어요 (실제 VM은 생성되지 않습니다).",
      plan_id: "plan-demo",
      instance_id,
      deployed_at: new Date().toISOString(),
      instance: {
        instance_id,
        name: slug,
        image_name: "ubuntu-22.04",
        flavor_name: predict.recommendations?.flavor ?? "aolda.medium",
        network_name: "aolda-net",
        key_name: "aolda-key",
        status: "ACTIVE",
        addresses: { "aolda-net": [{ addr: "10.0.3.42", type: "fixed", version: 4 }] },
        metadata: {},
      },
    }
    setSummary({ githubUrl: data.github_repo_url, predictResult: predict, deployResult })
    setSummaryOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 데모 전용 상단바 (전역 네비 대신) */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <Logo />
              <span className="text-lg font-semibold tracking-tight">launcha</span>
            </Link>
            <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
              <FlaskConical className="h-3 w-3" /> 데모
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm" variant="outline">
              <Link to="/login">
                실제 서비스 시작 <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* 데모 안내 배너 */}
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="font-medium text-foreground">데모 모드 — 더미 데이터로 흐름을 체험합니다</p>
            <p className="mt-1 text-muted-foreground">
              백엔드나 로그인 없이 동작해요. <strong className="text-foreground">새 배포 예측</strong>을 눌러
              GitHub 주소와 한 문장을 넣으면, 예측→검토→배포 흐름을 그대로 볼 수 있습니다. 실제 VM은 만들지 않아요.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">대시보드</h1>
            <p className="mt-1 text-sm text-muted-foreground">배포한 서비스와 예측 결과를 한 곳에서 확인하세요.</p>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> 새 배포 예측
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{projects.length}</span> 서비스
          </span>
          <span className="text-border">·</span>
          <span>
            <span className="font-semibold text-success">
              {projects.filter((p) => p.status === "deployed").length}
            </span>{" "}
            배포됨
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const meta = statusMeta[p.status] ?? statusMeta.stopped
            return (
              <div
                key={p.id}
                className="flex flex-col rounded-xl border border-border bg-card p-5 transition-smooth hover:border-primary/40 hover:shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 truncate font-mono text-xs text-muted-foreground">
                      <Github className="h-3 w-3 shrink-0" />
                      {p.repository.replace(/^https?:\/\/github\.com\//, "")}
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("shrink-0 font-medium", meta.cls)}>
                    {meta.label}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono">{formatWhen(p.last_deployment)}</span>
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      열기 <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
          <button
            onClick={() => setDialogOpen(true)}
            className="flex min-h-[7rem] items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground transition-smooth hover:border-primary/50 hover:text-foreground"
          >
            <Plus className="h-4 w-4" /> 새 배포 예측
          </button>
        </div>
      </div>

      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onPredict={onPredict}
        onDeploy={onDeploy}
      />

      {summary && (
        <DeploymentSummaryDialog
          open={summaryOpen}
          onOpenChange={(open) => {
            setSummaryOpen(open)
            if (!open) setSummary(null)
          }}
          data={summary}
        />
      )}
    </div>
  )
}
