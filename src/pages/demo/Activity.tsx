import { Link } from "react-router-dom"
import { useDemo, activityFeed, ActivityKind } from "@/demo/store"
import { cn } from "@/lib/utils"
import { Rocket, AlertTriangle, Gauge, ChevronRight } from "lucide-react"

const kindMeta: Record<ActivityKind, { icon: React.ElementType; cls: string }> = {
  deploy: { icon: Rocket, cls: "bg-success/10 text-success" },
  anomaly: { icon: AlertTriangle, cls: "bg-warning/10 text-warning" },
  resize: { icon: Gauge, cls: "bg-primary/10 text-primary" },
}

export default function Activity() {
  const { services } = useDemo()
  const feed = activityFeed(services, Date.now())

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">활동</h1>
        <p className="mt-1 text-sm text-muted-foreground">배포 · 이상 감지 · 리사이징 권장을 시간순으로 확인하세요.</p>
      </div>

      {feed.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
          아직 활동이 없어요. 새 배포 예측으로 시작해보세요.
        </div>
      ) : (
        <ol className="space-y-2">
          {feed.map((e) => {
            const m = kindMeta[e.kind]
            return (
              <li key={e.id}>
                <Link
                  to={`/demo/services/${e.serviceId}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-smooth hover:border-primary/40"
                >
                  <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", m.cls)}>
                    <m.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{e.serviceName}</div>
                    <div className="truncate text-sm text-muted-foreground">{e.label}</div>
                  </div>
                  <div className="shrink-0 font-mono text-xs text-muted-foreground">
                    {e.hoursAgo === 0 ? "방금" : `${e.hoursAgo}시간 전`}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
