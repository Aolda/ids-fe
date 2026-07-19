import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Sparkline } from "@/components/observability"
import { DemoService, pct, statusMeta } from "@/demo/store"
import { cn } from "@/lib/utils"
import { Github, ChevronRight } from "lucide-react"

export function ServiceCard({ s }: { s: DemoService }) {
  const meta = statusMeta[s.status] ?? statusMeta.stopped
  const series = s.metrics.map((m) => m.value)
  const current = series[series.length - 1] ?? 0
  return (
    <Link
      to={`/demo/services/${s.id}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-smooth hover:border-primary/40 hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="truncate">{s.name}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-smooth group-hover:opacity-100" />
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 truncate font-mono text-xs text-muted-foreground">
            <Github className="h-3 w-3 shrink-0" />
            {s.repository.replace(/^https?:\/\/github\.com\//, "")}
          </div>
        </div>
        <Badge variant="outline" className={cn("shrink-0 font-medium", meta.cls)}>
          {meta.label}
        </Badge>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">현재 부하</div>
          <div className="font-mono text-lg font-semibold text-foreground">{pct(current)}</div>
        </div>
        <Badge variant="outline" className="shrink-0 font-mono text-xs">
          {s.flavor}
        </Badge>
      </div>
      <div className="mt-2">
        <Sparkline data={series} />
      </div>
    </Link>
  )
}
