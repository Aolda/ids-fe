import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { mcpApi, projectsApi, DeployResponse } from "@/lib/mcpAPI"
import { backendApi } from "@/lib/backendAPI"
import { CreateProjectDialog, ProjectData } from "@/components/CreateProjectDialog"
import { DeploymentSummaryDialog, DeploymentSummaryData } from "@/components/DeploymentSummaryDialog"
import { MetricCard } from "@/components/metric-card"
import { ActivityLog } from "@/components/activity-log"
import { ResourceChart } from "@/components/resource-chart"
import { Button } from "@/components/ui/button"
import { Plus, ExternalLink, RefreshCw, Server, Zap, Activity, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

      // 인프라(OpenStack) 미가동 시 배포는 실패해도 예측·추천 결과는 보여준다
      // (데이터 연동 단계 — deploy/OpenStack 실배선은 후속 로드맵).
      let deployResponse: DeployResponse
      try {
        deployResponse = await mcpApi.deploy(deployData, state.token)
      } catch (deployErr: any) {
        deployResponse = {
          accepted: false,
          message: `배포 보류: ${deployErr?.message ?? "인프라(OpenStack) 미가동"} — 예측·추천은 정상 완료되었습니다.`,
          plan_id: null,
          instance_id: null,
          recommended_flavor: predictResponse?.recommendations?.flavor ?? null,
          provider_flavor: null,
          deployed_at: null,
          instance: null,
        } as unknown as DeployResponse
      }
      const repoSlug = projectData.github_repo_url.replace(/\/$/, "").split("/").pop() || projectData.github_repo_url
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
      } catch (projectErr: any) {
        console.warn("Failed to create project record", projectErr)
        toast({
          title: "프로젝트 기록 저장 실패",
          description: projectErr.message || "생성된 프로젝트 정보를 저장하지 못했습니다.",
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
      const cost = predictResponse?.recommendations?.cost_per_day
      const instanceLabel = deployResponse.instance?.name || deployResponse.instance_id || "할당 대기 중"

      toast({
        title: "예측 및 배포가 완료되었습니다",
        description: [
          flavor && cost
            ? `추천 스펙: ${flavor} (예상 비용: $${cost}/day)`
            : "자연어 요구사항을 기반으로 리소스를 예측했습니다.",
          `생성된 VM: ${instanceLabel}. 세부 정보는 요약 창에서 확인하세요.`,
        ].join(" "),
      })
    } catch (err: any) {
      throw new Error(err.message || "프로젝트 생성에 실패했습니다.")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Welcome to LaunchA
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Professional CI/CD deployment management for modern development teams. 
              Monitor, deploy, and scale your applications with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="hero" 
                size="lg" 
                className="shadow-glow"
                onClick={() => setIsProjectDialogOpen(true)}
              >
                <Plus className="mr-2 h-5 w-5" />
                Create New Project
              </Button>
              <Button variant="outline" size="lg">
                <ExternalLink className="mr-2 h-5 w-5" />
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Metrics Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Projects"
              value={12}
              change={{ value: 20, type: "increase" }}
              icon={<Server className="h-4 w-4" />}
            />
            <MetricCard
              title="Deployments (24h)"
              value={47}
              change={{ value: 12, type: "increase" }}
              icon={<Zap className="h-4 w-4" />}
            />
            <MetricCard
              title="Active VMs"
              value={8}
              change={{ value: 0, type: "neutral" }}
              icon={<Activity className="h-4 w-4" />}
            />
            <MetricCard
              title="Team Members"
              value={5}
              change={{ value: 25, type: "increase" }}
              icon={<Users className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Resource Monitoring */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-6">Resource Usage</h3>
          <ResourceChart />
        </div>


        {/* Activity Log */}
        <div>
          <ActivityLog />
        </div>
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
