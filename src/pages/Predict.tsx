import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { mcpApi, projectsApi, DeployResponse, Project } from "@/lib/mcpAPI"
import { backendApi } from "@/lib/backendAPI"
import { CreateProjectDialog, ProjectData } from "@/components/CreateProjectDialog"
import { DeploymentSummaryDialog, DeploymentSummaryData } from "@/components/DeploymentSummaryDialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Rocket, Github, Plus, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="mt-8">
      <div className="card-lit relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-16 text-center">
        <div className="mx-auto max-w-lg">
          <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Rocket className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">아직 배포한 서비스가 없어요</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            GitHub 주소와 한 문장이면 충분합니다. 첫 예측을 시작하면 여기에 서비스가 쌓입니다.
          </p>
          <div className="mt-7">
            <Button onClick={onStart} size="lg" variant="hero">
              <Github className="h-4 w-4" /> 첫 배포 예측 시작하기
            </Button>
          </div>
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            공개 GitHub 저장소 주소만 있으면 됩니다
          </p>
        </div>
      </div>
    </div>
  )
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const statusMeta: Record<Project["status"], { label: string; cls: string }> = {
  deployed: { label: "배포됨", cls: "bg-success/10 text-success border-success/20" },
  building: { label: "빌드 중", cls: "bg-primary/10 text-primary border-primary/20" },
  error: { label: "오류", cls: "bg-destructive/10 text-destructive border-destructive/20" },
  stopped: { label: "중지됨", cls: "bg-muted text-muted-foreground border-border" },
}

function ProjectCard({ p }: { p: Project }) {
  const meta = statusMeta[p.status] ?? statusMeta.stopped
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5 transition-smooth hover:border-primary/40 hover:shadow-card">
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
}

function ProjectGrid({ projects, onNew }: { projects: Project[]; onNew: () => void }) {
  const deployed = projects.filter((p) => p.status === "deployed").length
  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          <span className="tabular font-semibold text-foreground">{projects.length}</span> 서비스
        </span>
        <span className="text-border">·</span>
        <span>
          <span className="tabular font-semibold text-success">{deployed}</span> 배포됨
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.id} p={p} />
        ))}
        <button
          onClick={onNew}
          className="flex min-h-[7rem] items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground transition-smooth hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus className="h-4 w-4" /> 새 배포 예측
        </button>
      </div>
    </div>
  )
}

export default function Predict() {
  const { state } = useAuth()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [deploymentSummary, setDeploymentSummary] = useState<DeploymentSummaryData | null>(null)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)

  const loadProjects = useCallback(async () => {
    if (!state.token) {
      setProjects([])
      return
    }
    try {
      const res = await projectsApi.getProjects(state.token)
      setProjects(res.projects ?? [])
    } catch {
      // 백엔드 미가동/조회 실패 → 빈 상태로 처리(온보딩 노출). 예측 자체는 별개.
      setProjects([])
    }
  }, [state.token])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleCreateProject = async (projectData: ProjectData) => {
    if (!state.token) {
      throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.")
    }

    try {
      localStorage.setItem("project_data", JSON.stringify(projectData))
      const serviceId = `svc-${Date.now()}`

      // 자연어 + GitHub URL → IDS 예측 (POST /api/v1/plans)
      const predictResponse = await backendApi.predictWithNaturalLanguage({
        github_url: projectData.github_repo_url,
        user_input: projectData.requirements,
      })

      const deployData = {
        github_url: projectData.github_repo_url,
        // 서버가 배포 시 generate_plan 을 재실행하므로, 자연어를 넘겨야 미리보기 flavor=실제 배포 flavor.
        natural_language: projectData.requirements,
        repo_id: projectData.github_repo_url.split("/").pop() || projectData.github_repo_url,
        image_tag: "latest",
        env_config: {
          service_id: serviceId,
          recommended_flavor: predictResponse?.recommendations?.flavor ?? null,
          recommendations: predictResponse?.recommendations ?? null,
          extracted_context: predictResponse?.extracted_context ?? null,
        },
      }

      // 인프라(OpenStack) 미가동 시 배포가 실패해도 예측·추천 결과는 보여준다.
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

      let created: Project | null = null
      let persistError: string | null = null
      try {
        const ctx = predictResponse?.extracted_context
        created = await projectsApi.createProject(
          {
            name: repoSlug,
            repository: projectData.github_repo_url,
            status: deployResponse.accepted ? "deployed" : "error",
            last_deployment: lastDeployment,
            url: deployResponse.instance?.metadata?.public_url ?? null,
            instance_id: deployResponse.instance_id ?? null,
            // 예측 컨텍스트를 함께 저장 — 안 보내면 upsert 가 기본값으로 덮어 재사용 컨텍스트가 죽는다.
            service_type: ctx?.service_type,
            time_slot: ctx?.time_slot,
            runtime_env: ctx?.runtime_env,
            expected_users: ctx?.expected_users ?? null,
          },
          state.token
        )
      } catch (projectErr) {
        console.warn("Failed to create project record", projectErr)
        persistError =
          projectErr instanceof Error
            ? projectErr.message
            : "생성된 프로젝트 정보를 저장하지 못했습니다."
      }

      // 저장 성공 → 새 카드를 낙관적으로 추가(2차 GET 불필요). 실패 → best-effort 재조회.
      if (created) {
        const appended = created
        setProjects((prev) => [appended, ...(prev ?? [])])
      } else {
        loadProjects()
      }

      setDeploymentSummary({
        githubUrl: projectData.github_repo_url,
        serviceId,
        predictResult: predictResponse,
        deployResult: deployResponse,
      })
      setIsSummaryOpen(true)

      const flavor = predictResponse?.recommendations?.flavor
      const deployed = deployResponse.accepted
      const instanceLabel =
        deployResponse.instance?.name || deployResponse.instance_id || "할당 대기 중"

      // 기록 저장 실패 시엔 '성공' 토스트로 모순되지 않게 단일 메시지로.
      if (persistError) {
        toast({
          title: "예측 완료 · 기록 저장 실패",
          description: `${flavor ? `추천 등급: ${flavor}. ` : ""}${persistError}`,
          variant: "destructive",
        })
      } else {
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
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "프로젝트 생성에 실패했습니다.")
    }
  }

  const hasProjects = projects !== null && projects.length > 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">대시보드</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            배포한 서비스와 예측 결과를 한 곳에서 확인하세요.
          </p>
        </div>
        {hasProjects && (
          <Button size="sm" onClick={() => setIsProjectDialogOpen(true)}>
            <Plus className="h-4 w-4" /> 새 배포 예측
          </Button>
        )}
      </div>

      {projects === null ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState onStart={() => setIsProjectDialogOpen(true)} />
      ) : (
        <ProjectGrid projects={projects} onNew={() => setIsProjectDialogOpen(true)} />
      )}

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
