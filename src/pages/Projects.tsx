import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { mcpApi } from "@/lib/mcpAPI"
import { projectsApi, Project } from "@/lib/mcpAPI"
import { useToast } from "@/hooks/use-toast"
import { 
  Search, 
  Github, 
  Eye, 
  ExternalLink,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Globe
} from "lucide-react"

export default function Projects() {
  const { state } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  // 프로젝트 목록 로드
  const loadProjects = useCallback(async () => {
    if (!state.token) {
      setProjects([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await projectsApi.getProjects(state.token)
      setProjects(response.projects ?? [])
    } catch (err) {
      // 백엔드 미가동/조회 실패 → 빈 목록(정직). 가짜 데이터로 대체하지 않는다.
      console.warn("프로젝트 로드 실패", err)
      setProjects([])
    } finally {
      setIsLoading(false)
    }
  }, [state.token])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const filteredProjects = projects.filter(project => {
    const query = searchQuery.toLowerCase()
    return (
      project.name.toLowerCase().includes(query) ||
      project.repository.toLowerCase().includes(query)
    )
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "deployed":
        return <CheckCircle className="h-4 w-4 text-success" />
      case "building":
        return <Clock className="h-4 w-4 text-warning animate-spin" />
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />
      case "stopped":
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "deployed":
        return <Badge className="bg-success/10 text-success border-success/20">Deployed</Badge>
      case "building":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Building</Badge>
      case "error":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Error</Badge>
      case "stopped":
        return <Badge variant="secondary">Stopped</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handleDestroyProject = async (project: Project) => {
    if (!state.token) {
      toast({
        title: "오류",
        description: "인증 토큰이 없습니다. 다시 로그인해주세요.",
        variant: "destructive"
      })
      return
    }

    setIsDeleting(project.id)
    try {
      // 프로젝트 삭제
      await projectsApi.deleteProject(project.id, state.token)
      
      // 인스턴스가 있으면 리소스도 삭제
      if (project.service_id && project.instance_id) {
        try {
          await mcpApi.destroy(
            {
              service_id: project.service_id,
              instance_id: project.instance_id,
            },
            state.token
          )
        } catch (destroyErr) {
          // 리소스 삭제 실패는 경고만 표시 (프로젝트는 이미 삭제됨)
          console.warn("리소스 삭제 실패:", destroyErr)
        }
      }
      
      toast({
        title: "프로젝트 삭제 완료",
        description: `${project.name} 프로젝트가 성공적으로 삭제되었습니다.`,
      })
      
      // 프로젝트 목록 새로고침
      await loadProjects()
    } catch (err) {
      toast({
        title: "프로젝트 삭제 실패",
        description: err instanceof Error ? err.message : "프로젝트 삭제에 실패했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const showLoadingState = isLoading && projects.length === 0

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your deployment projects and monitor their status
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadProjects}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Projects Grid */}
      {showLoadingState ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <RefreshCw className="h-12 w-12 text-muted-foreground animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            프로젝트를 불러오는 중...
          </h3>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="shadow-card transition-smooth hover:shadow-lg">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg font-semibold">
                  {project.name}
                </CardTitle>
                <div className="flex items-center gap-1">
                  {getStatusIcon(project.status)}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Github className="h-4 w-4" />
                <span className="truncate" title={project.repository}>
                  {project.repository.replace('https://github.com/', '')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                {getStatusBadge(project.status)}
                {project.url && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={project.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {project.lastDeployment 
                    ? `Last deployed ${new Date(project.lastDeployment).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}`
                    : "Not deployed yet"}
                </span>
              </div>

              <div className="flex gap-2">
                <Dialog 
                  open={isDetailDialogOpen && selectedProject?.id === project.id} 
                  onOpenChange={(open) => {
                    setIsDetailDialogOpen(open)
                    if (!open) setSelectedProject(null)
                  }}
                >
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setSelectedProject(project)
                        setIsDetailDialogOpen(true)
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>프로젝트 상세 정보</DialogTitle>
                      <DialogDescription>
                        {project.name} 프로젝트의 상세 정보를 확인합니다.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {/* 프로젝트 기본 정보 */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">프로젝트 이름</p>
                          <p className="text-foreground">{project.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <Github className="h-4 w-4" />
                            GitHub Repository
                          </p>
                          <div className="flex items-center gap-2">
                            <a
                              href={project.repository}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline truncate"
                            >
                              {project.repository}
                            </a>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">배포 상태</p>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(project.status)}
                            {getStatusBadge(project.status)}
                          </div>
                        </div>
                        {project.url && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              배포 URL
                            </p>
                            <div className="flex items-center gap-2">
                              <a
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline truncate"
                              >
                                {project.url}
                              </a>
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </div>
                        )}
                        {project.service_id && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Service ID</p>
                            <p className="text-foreground font-mono text-sm">{project.service_id}</p>
                          </div>
                        )}
                        {project.instance_id && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Instance ID</p>
                            <p className="text-foreground font-mono text-sm">{project.instance_id}</p>
                          </div>
                        )}
                        {project.lastDeployment && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              마지막 배포일
                            </p>
                            <p className="text-foreground">
                              {new Date(project.lastDeployment).toLocaleString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="pt-2 border-t border-border">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="w-full"
                      disabled={isDeleting === project.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isDeleting === project.id ? "삭제 중..." : "프로젝트 삭제"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>프로젝트를 삭제하시겠습니까?</AlertDialogTitle>
                      <AlertDialogDescription>
                        이 작업은 되돌릴 수 없습니다. 프로젝트와 모든 관련 리소스가 영구적으로 삭제됩니다.
                        <br />
                        <strong>{project.name}</strong> 프로젝트를 삭제하시겠습니까?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDestroyProject(project)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No projects found
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "Try adjusting your search terms" : "프로젝트가 없습니다. 대시보드에서 프로젝트를 생성해주세요."}
          </p>
        </div>
      )}
    </div>
  )
}

