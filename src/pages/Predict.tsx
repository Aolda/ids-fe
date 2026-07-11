import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { mcpApi, projectsApi, DeployResponse } from "@/lib/mcpAPI"
import { backendApi } from "@/lib/backendAPI"
import { CreateProjectDialog, ProjectData } from "@/components/CreateProjectDialog"
import { DeploymentSummaryDialog, DeploymentSummaryData } from "@/components/DeploymentSummaryDialog"
import { MetricCard } from "@/components/metric-card"
import { ActivityLog } from "@/components/activity-log"
import { PredictionChart, ObservedCharts } from "@/components/resource-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Plus,
  Boxes,
  Server,
  Layers,
  AlertTriangle,
  Github,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

/* 현재 활성 서비스의 등급 결정 요약 (배선 전까지 데모용) */
function FlavorRecommendation() {
  const reasons = [
    { k: "예측 피크", v: "0.90" },
    { k: "헤드룸 0.90 / 0.70", v: "1.29" },
    { k: "서비스 유형", v: "web" },
    { k: "가용량 검증", v: "통과" },
  ]
  return (
    <Card className="card-lit relative overflow-hidden border-border bg-gradient-to-b from-primary/[0.05] to-transparent shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">현재 추천 등급</CardTitle>
        <p className="text-xs text-muted-foreground">shop-api · 결정론적 등급 결정</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl font-semibold text-primary">aolda.large</span>
        </div>
        <div className="tabular mt-1 text-sm text-muted-foreground">4 vCPU · 8 GB · 80 GB</div>

        <div className="my-4 h-px bg-border" />

        <dl className="space-y-2.5">
          {reasons.map((r) => (
            <div key={r.k} className="flex items-center justify-between text-sm">
              <dt className="text-muted-foreground">{r.k}</dt>
              <dd className="tabular font-medium text-foreground">{r.v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" />
          자동 배포 가능
        </div>
      </CardContent>
    </Card>
  )
}

export default function Predict() {
  const { state } = useAuth()
  const { toast } = useToast()
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [deploymentSummary, setDeploymentSummary] = useState<DeploymentSummaryData | null>(null)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)

  const handleCreateProject = async (projectData: ProjectData) => {
    if (!state.token) {
      throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.")
    }

    try {
      // 1. (임시) 프로필 API는 사용하지 않고, 프로젝트 정보를 로컬 스토리지에만 저장
      localStorage.setItem("project_data", JSON.stringify(projectData))

      // 2. service_id 생성 (로깅/추적용)
      const serviceId = `svc-${Date.now()}`

      // 3. backend_api에 자연어 + GitHub URL 전달 → /api/predict 호출
      const predictResponse = await backendApi.predictWithNaturalLanguage({
        github_url: projectData.github_repo_url,
        user_input: projectData.requirements,
      })

      // 4. MCP Core Deploy 서버에 배포 요청
      // DeployRequest 스키마에 맞게 JSON 구성
      const deployData = {
        github_url: projectData.github_repo_url,
        repo_id: projectData.github_repo_url.split("/").pop() || projectData.github_repo_url,
        image_tag: "latest",
        env_config: {
          service_id: serviceId,
          // backend_api 예측 결과를 그대로 전달하여 Deploy 단계에서 재사용
          recommended_flavor: predictResponse?.recommendations?.flavor ?? null,
          recommendations: predictResponse?.recommendations ?? null,
          extracted_context: predictResponse?.extracted_context ?? null,
        },
      }

      // 인프라(OpenStack) 미가동 시 배포가 실패해도 예측·추천 결과는 보여준다
      // (데이터 연동 단계 — deploy/OpenStack 실배선은 후속 로드맵).
      let deployResponse: DeployResponse
      try {
        deployResponse = await mcpApi.deploy(deployData, state.token)
      } catch (deployErr) {
        deployResponse = {
          accepted: false,
          message: `배포 보류: ${
            deployErr instanceof Error ? deployErr.message : "인프라(OpenStack) 미가동"
          } — 예측·추천은 정상 완료되었습니다.`,
          plan_id: null,
          instance_id: null,
          deployed_at: null,
          instance: null,
        }
      }
      const repoSlug =
        projectData.github_repo_url.replace(/\/$/, "").split("/").pop() ||
        projectData.github_repo_url
      const lastDeployment = deployResponse.deployed_at || new Date().toISOString()

      try {
        if (state.token) {
          await projectsApi.createProject(
            {
              name: repoSlug,
              repository: projectData.github_repo_url,
              status: deployResponse.accepted ? "deployed" : "error",
              lastDeployment,
              url: deployResponse.instance?.metadata?.public_url ?? null,
              service_id: serviceId,
              instance_id: deployResponse.instance_id ?? null,
            },
            state.token
          )
        }
      } catch (projectErr) {
        console.warn("Failed to create project record", projectErr)
        toast({
          title: "프로젝트 기록 저장 실패",
          description:
            projectErr instanceof Error
              ? projectErr.message
              : "생성된 프로젝트 정보를 저장하지 못했습니다.",
          variant: "destructive",
        })
      }
      const summaryPayload: DeploymentSummaryData = {
        githubUrl: projectData.github_repo_url,
        serviceId,
        predictResult: predictResponse,
        deployResult: deployResponse,
      }
      setDeploymentSummary(summaryPayload)
      setIsSummaryOpen(true)

      const flavor = predictResponse?.recommendations?.flavor
      const deployed = deployResponse.accepted
      const instanceLabel =
        deployResponse.instance?.name || deployResponse.instance_id || "할당 대기 중"

      toast({
        title: deployed ? "예측 및 배포가 완료되었습니다" : "예측 완료 · 배포 보류",
        description: [
          flavor
            ? `추천 등급: ${flavor}.`
            : "자연어 요구사항을 기반으로 리소스를 예측했습니다.",
          deployed
            ? `생성된 VM: ${instanceLabel}. 세부 정보는 요약 창에서 확인하세요.`
            : "인프라 연동 후 배포됩니다. 예측·추천 결과는 요약 창에서 확인하세요.",
        ].join(" "),
      })
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "프로젝트 생성에 실패했습니다.")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 페이지 헤더 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight">대시보드</h1>
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              데모 데이터
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            예측·등급 결정·배포·관측을 한 곳에서 확인하세요.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsProjectDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          새 배포 예측
        </Button>
      </div>

      {/* 배포 예측 시작 패널 — 제품의 핵심 진입점 */}
      <button
        onClick={() => setIsProjectDialogOpen(true)}
        className="group mt-6 flex w-full items-center gap-4 rounded-xl border border-dashed border-border bg-card p-5 text-left transition-smooth hover:border-primary/50 hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Github className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-foreground">GitHub 주소와 요구사항으로 새 배포를 시작하세요</div>
          <div className="mt-0.5 truncate text-sm text-muted-foreground">
            저장소 분석 → 24시간 수요 예측 → 등급 결정 → 배포까지 자동으로 이어집니다
          </div>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-smooth group-hover:translate-x-1 group-hover:text-primary" />
      </button>

      {/* 지표 요약 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="배포된 서비스"
          value={12}
          hint="오류 1"
          icon={<Boxes className="h-4 w-4" />}
        />
        <MetricCard
          title="실행 중 VM"
          value={8}
          hint="aolda 클러스터"
          icon={<Server className="h-4 w-4" />}
        />
        <MetricCard
          title="재추천 제안"
          value={1}
          hint="드리프트 감지"
          icon={<Layers className="h-4 w-4" />}
        />
        <MetricCard
          title="이상 감지 · 24h"
          value={2}
          hint="RCA 1건"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      {/* 예측 + 등급 결정 */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PredictionChart />
        </div>
        <FlavorRecommendation />
      </div>

      {/* 관측 지표 */}
      <div className="mt-6">
        <h2 className="mb-4 text-sm font-semibold text-foreground">관측 지표</h2>
        <ObservedCharts />
      </div>

      {/* 활동 */}
      <div className="mt-6">
        <ActivityLog />
      </div>

      <CreateProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        onSubmit={handleCreateProject}
      />

      {deploymentSummary && (
        <DeploymentSummaryDialog
          open={isSummaryOpen}
          onOpenChange={(open) => {
            setIsSummaryOpen(open)
            if (!open) {
              setDeploymentSummary(null)
            }
          }}
          data={deploymentSummary}
        />
      )}
    </div>
  )
}
