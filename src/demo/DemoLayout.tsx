import { createContext, useContext, useState } from "react"
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { CreateProjectDialog, ProjectData } from "@/components/CreateProjectDialog"
import {
  DeploymentSummaryDialog,
  DeploymentSummaryData,
} from "@/components/DeploymentSummaryDialog"
import { PredictResponse } from "@/lib/backendAPI"
import { DeployResponse } from "@/lib/mcpAPI"
import { DemoProvider, DemoService, synthPredict, useDemo } from "@/demo/store"
import { FlaskConical, Menu, Plus, ArrowRight } from "lucide-react"

const NewPredictionCtx = createContext<{ open: () => void }>({ open: () => {} })
export const useNewPrediction = () => useContext(NewPredictionCtx)

const NAV = [
  { to: "/demo", label: "대시보드", end: true },
  { to: "/demo/services", label: "프로젝트", end: false },
  { to: "/demo/settings", label: "설정", end: false },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-smooth ${
    isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
  }`

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

function deployResultFor(svc: DemoService): DeployResponse {
  return {
    accepted: true,
    message: "데모 배포가 완료됐어요 (실제 VM은 생성되지 않습니다).",
    plan_id: "plan-demo",
    instance_id: svc.instance_id,
    deployed_at: svc.last_deployment,
    instance: {
      instance_id: svc.instance_id,
      name: svc.name,
      image_name: svc.image,
      flavor_name: svc.flavor,
      network_name: svc.network,
      key_name: svc.key_name,
      status: "ACTIVE",
      addresses: { [svc.network]: [{ addr: svc.ip, type: "fixed", version: 4 }] },
      metadata: {},
    },
  }
}

function DemoNav({ onNew }: { onNew: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="메뉴 열기">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="mt-6 flex flex-col gap-1">
                  {NAV.map((n) => (
                    <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setMobileOpen(false)} className={linkClass}>
                      {n.label}
                    </NavLink>
                  ))}
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setMobileOpen(false)
                      onNew()
                    }}
                  >
                    <Plus className="h-4 w-4" /> 새 배포 예측
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Link to="/demo" className="flex items-center gap-2.5">
              <Logo />
              <span className="text-lg font-semibold tracking-tight">launcha</span>
            </Link>
            <Badge variant="outline" className="hidden gap-1 border-primary/30 bg-primary/5 text-primary sm:inline-flex">
              <FlaskConical className="h-3 w-3" /> 데모
            </Badge>

            <div className="hidden items-center gap-1 md:flex">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.end} className={linkClass}>
                  {n.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button size="sm" onClick={onNew} className="hidden sm:inline-flex">
              <Plus className="h-4 w-4" /> 새 배포 예측
            </Button>
            <ThemeToggle />
            <Button asChild size="sm" variant="outline">
              <Link to="/login">
                실제 서비스 <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

function DemoInner() {
  const { addFromPredict } = useDemo()
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [summary, setSummary] = useState<DeploymentSummaryData | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [lastId, setLastId] = useState<number | null>(null)

  const onPredict = async (data: ProjectData): Promise<PredictResponse> => {
    await delay(2800) // 예측 처리단계를 실제처럼 보여주기 위한 지연
    return synthPredict(data)
  }

  const onDeploy = async (data: ProjectData, predict: PredictResponse): Promise<void> => {
    await delay(2200)
    const svc = addFromPredict(data, predict)
    setLastId(svc.id)
    setSummary({ githubUrl: data.github_repo_url, predictResult: predict, deployResult: deployResultFor(svc) })
    setSummaryOpen(true)
  }

  return (
    <NewPredictionCtx.Provider value={{ open: () => setDialogOpen(true) }}>
      <div className="min-h-screen bg-background">
        <DemoNav onNew={() => setDialogOpen(true)} />
        <Outlet />
      </div>

      <CreateProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} onPredict={onPredict} onDeploy={onDeploy} />

      {summary && (
        <DeploymentSummaryDialog
          open={summaryOpen}
          onOpenChange={(open) => {
            setSummaryOpen(open)
            if (!open) {
              setSummary(null)
              // 배포한 서비스의 상세 대시보드로 이어준다 — "그 서비스에 맞는 대시보드".
              if (lastId) navigate(`/demo/services/${lastId}`)
            }
          }}
          data={summary}
        />
      )}
    </NewPredictionCtx.Provider>
  )
}

export default function DemoLayout() {
  return (
    <DemoProvider>
      <DemoInner />
    </DemoProvider>
  )
}
