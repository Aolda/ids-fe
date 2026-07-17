import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/AuthContext"
import { mcpApi, projectsApi, Project } from "@/lib/mcpAPI"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Search, Github, ExternalLink, Trash2, RefreshCw, Boxes } from "lucide-react"

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

const repoPath = (repo: string) => repo.replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "")

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

function ProjectCard({
  p,
  isDeleting,
  onDelete,
}: {
  p: Project
  isDeleting: boolean
  onDelete: (p: Project) => void
}) {
  const meta = statusMeta[p.status] ?? statusMeta.stopped
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5 transition-smooth hover:border-primary/40 hover:shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium">{p.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 truncate font-mono text-xs text-muted-foreground">
            <Github className="h-3 w-3 shrink-0" />
            {repoPath(p.repository)}
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

      <div className="mt-4 flex gap-2 border-t border-border pt-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1">
              상세
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>{p.name}</DialogTitle>
              <DialogDescription>프로젝트 배포 상세 정보</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-2">
              <DetailRow label="GitHub">
                <a
                  href={p.repository}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-primary hover:underline"
                >
                  {repoPath(p.repository)} <ExternalLink className="h-3 w-3" />
                </a>
              </DetailRow>
              <DetailRow label="상태">
                <Badge variant="outline" className={cn("font-medium", meta.cls)}>
                  {meta.label}
                </Badge>
              </DetailRow>
              {p.url && (
                <DetailRow label="배포 URL">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-primary hover:underline"
                  >
                    {p.url} <ExternalLink className="h-3 w-3" />
                  </a>
                </DetailRow>
              )}
              {p.instance_id && (
                <DetailRow label="Instance ID">
                  <span className="font-mono text-muted-foreground">{p.instance_id}</span>
                </DetailRow>
              )}
              <DetailRow label="마지막 배포">
                <span className="font-mono text-muted-foreground">{formatWhen(p.last_deployment)}</span>
              </DetailRow>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              aria-label={`${p.name} 삭제`}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>프로젝트를 삭제할까요?</AlertDialogTitle>
              <AlertDialogDescription>
                되돌릴 수 없습니다. <strong className="text-foreground">{p.name}</strong>와 관련 리소스가 영구 삭제됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(p)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export default function Projects() {
  const { state } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [loadError, setLoadError] = useState(false)

  const loadProjects = useCallback(async () => {
    if (!state.token) {
      setProjects([])
      return
    }
    try {
      const response = await projectsApi.getProjects(state.token)
      setProjects(response.projects ?? [])
      setLoadError(false)
    } catch (err) {
      // 조회 실패는 '서비스 없음'과 다르다 — 빈 온보딩으로 위장하지 않고 오류+재시도를 보여준다.
      console.warn("프로젝트 로드 실패", err)
      setLoadError(true)
      setProjects([])
    }
  }, [state.token])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleDelete = async (project: Project) => {
    if (!state.token) return
    setIsDeleting(project.id)
    try {
      // VM(비싼 리소스) 을 먼저 정리한다. 실패하면 기록을 지우지 않는다 — 안 그러면 사용자는
      // 지운 줄 알지만 OpenStack 에 고아 VM 이 남아 한정된 용량을 계속 잡아먹는다.
      if (project.instance_id) {
        try {
          await mcpApi.destroy(project.instance_id, state.token)
        } catch (destroyErr) {
          console.warn("리소스 삭제 실패:", destroyErr)
          toast({
            title: "VM 정리 실패 — 삭제를 취소했어요",
            description: `${project.name}의 인스턴스(${project.instance_id})를 정리하지 못했습니다. 리소스가 아직 살아있어 기록을 지우지 않았습니다. 잠시 후 다시 시도해주세요.`,
            variant: "destructive",
          })
          return
        }
      }
      await projectsApi.deleteProject(project.id, state.token)
      toast({ title: "프로젝트 삭제 완료", description: `${project.name}를 삭제했습니다.` })
      setProjects((prev) => (prev ? prev.filter((p) => p.id !== project.id) : prev))
    } catch (err) {
      toast({
        title: "프로젝트 삭제 실패",
        description: err instanceof Error ? err.message : "프로젝트 삭제에 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const filtered = (projects ?? []).filter((p) => {
    const q = searchQuery.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.repository.toLowerCase().includes(q)
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">프로젝트</h1>
          <p className="mt-1 text-sm text-muted-foreground">배포한 서비스를 관리하고 상태를 확인하세요.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setProjects(null)
            loadProjects()
          }}
        >
          <RefreshCw className="h-4 w-4" />
          새로고침
        </Button>
      </div>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="이름 또는 저장소로 검색"
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {projects === null ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : loadError ? (
        <div className="mt-6 rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 px-6 py-16 text-center">
          <h3 className="font-semibold">목록을 불러오지 못했어요</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            백엔드에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setProjects(null)
              loadProjects()
            }}
          >
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Boxes className="h-5 w-5" />
          </div>
          <h3 className="font-semibold">
            {searchQuery ? "검색 결과가 없어요" : "아직 배포한 서비스가 없어요"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery ? (
              "다른 검색어를 시도해보세요."
            ) : (
              <>
                대시보드에서 첫 예측을 시작하면 여기에 쌓입니다.{" "}
                <Link to="/predict" className="font-medium text-primary hover:underline">
                  대시보드로 이동
                </Link>
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} p={p} isDeleting={isDeleting === p.id} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
