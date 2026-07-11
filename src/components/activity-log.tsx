import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  AlertTriangle,
  Activity,
  Layers,
  Rocket,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityItem {
  id: string
  type: "deploy" | "flavor" | "anomaly" | "prediction"
  status: "success" | "warning" | "info"
  title: string
  description: string
  timestamp: string
  project?: string
}

/* IDS 도메인 이벤트 (배선 전까지 데모용) */
const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "deploy",
    status: "success",
    title: "배포 완료",
    description: "shop-api를 aolda.large로 배포했습니다 (4 vCPU · 8GB).",
    timestamp: "2분 전",
    project: "shop-api",
  },
  {
    id: "2",
    type: "anomaly",
    status: "warning",
    title: "이상 감지 · RCA",
    description: "트래픽 급증으로 CPU 96% 도달. opensre가 근본원인을 분석 중입니다.",
    timestamp: "18분 전",
    project: "event-web",
  },
  {
    id: "3",
    type: "flavor",
    status: "info",
    title: "등급 재추천",
    description: "관측 수요가 예측 대비 상승 — small → medium 상향을 제안합니다.",
    timestamp: "41분 전",
    project: "docs-portal",
  },
  {
    id: "4",
    type: "prediction",
    status: "success",
    title: "24시간 예측 생성",
    description: "예측 피크 0.90. 저녁 시간대 수요 집중이 예상됩니다.",
    timestamp: "1시간 전",
    project: "shop-api",
  },
  {
    id: "5",
    type: "deploy",
    status: "success",
    title: "배포 완료",
    description: "docs-portal을 aolda.small로 배포했습니다 (1 vCPU · 2GB).",
    timestamp: "3시간 전",
    project: "docs-portal",
  },
]

const typeIcon: Record<ActivityItem["type"], React.ReactNode> = {
  deploy: <Rocket className="h-4 w-4" />,
  anomaly: <Search className="h-4 w-4" />,
  flavor: <Layers className="h-4 w-4" />,
  prediction: <Activity className="h-4 w-4" />,
}

function StatusBadge({ status }: { status: ActivityItem["status"] }) {
  const map = {
    success: { cls: "bg-success/10 text-success border-success/20", label: "완료", icon: CheckCircle },
    warning: { cls: "bg-warning/10 text-warning border-warning/20", label: "주의", icon: AlertTriangle },
    info: { cls: "bg-primary/10 text-primary border-primary/20", label: "제안", icon: Layers },
  }[status]
  const Icon = map.icon
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", map.cls)}>
      <Icon className="h-3 w-3" />
      {map.label}
    </Badge>
  )
}

export function ActivityLog() {
  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Activity className="h-4 w-4 text-primary" />
          최근 활동
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {mockActivities.map((a, i) => (
          <div
            key={a.id}
            className={cn(
              "flex items-start gap-4 px-6 py-4 transition-smooth hover:bg-accent/40",
              i !== mockActivities.length - 1 && "border-b border-border"
            )}
          >
            <div
              className={cn(
                "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border",
                a.status === "success" && "border-success/20 bg-success/10 text-success",
                a.status === "warning" && "border-warning/20 bg-warning/10 text-warning",
                a.status === "info" && "border-primary/20 bg-primary/10 text-primary"
              )}
            >
              {typeIcon[a.type]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-medium text-foreground">{a.title}</h4>
                <StatusBadge status={a.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{a.timestamp}</span>
                {a.project && (
                  <>
                    <span className="text-border">·</span>
                    <span className="font-mono text-foreground/70">{a.project}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
