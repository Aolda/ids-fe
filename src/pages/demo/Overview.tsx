import { Button } from "@/components/ui/button"
import { DemandChart, MetricTile } from "@/components/observability"
import { ServiceCard } from "@/pages/demo/ServiceCard"
import { useDemo, avg, pct, FLAVOR_SPECS, anomaliesOf, MetricPoint } from "@/demo/store"
import { useNewPrediction } from "@/demo/DemoLayout"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"

function Kpi({ label, value, accent }: { label: string; value: React.ReactNode; accent?: "success" | "warning" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 font-mono text-xl font-semibold tracking-tight",
          accent === "success" ? "text-success" : accent === "warning" ? "text-warning" : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  )
}

export default function Overview() {
  const { services } = useDemo()
  const { open } = useNewPrediction()

  // 전체 서비스의 시간대별 평균(관측된 metric_history 형태에서 집계).
  const at = (h: number, pick: (m: MetricPoint) => number) =>
    avg(services.map((s) => pick(s.metrics[h] ?? s.metrics[s.metrics.length - 1])).filter((v) => v != null))
  const aggDemand = Array.from({ length: 24 }, (_, h) => at(h, (m) => m.value))
  const aggCpu = Array.from({ length: 24 }, (_, h) => at(h, (m) => m.cpu_mean))
  const aggMem = Array.from({ length: 24 }, (_, h) => at(h, (m) => m.mem_mean))
  const aggNet = Array.from({ length: 24 }, (_, h) => at(h, (m) => m.network_util))

  const deployed = services.filter((s) => s.status === "deployed").length
  const totalVcpu = services.reduce((sum, s) => sum + (FLAVOR_SPECS[s.flavor]?.vcpu ?? 0), 0)
  const totalRam = services.reduce((sum, s) => sum + (FLAVOR_SPECS[s.flavor]?.ram ?? 0), 0)
  const totalCost = services.reduce((sum, s) => sum + s.cost_per_day, 0)
  const anomalyCount = services.reduce((sum, s) => sum + anomaliesOf(s.metrics).length, 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-foreground">데모 모드</strong> — 백엔드·로그인 없이 더미데이터로 전체 흐름을
        체험합니다. 데이터는 실제로 수집하는 형태(metric_history · 예측 · 7단계 flavor)와 동일해요.
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">대시보드</h1>
          <p className="mt-1 text-sm text-muted-foreground">배포한 모든 서비스를 한눈에 관측하세요.</p>
        </div>
        <Button size="sm" onClick={open}>
          <Plus className="h-4 w-4" /> 새 배포 예측
        </Button>
      </div>

      {/* Fleet 요약 */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="서비스" value={services.length} />
        <Kpi label="배포됨" value={deployed} accent="success" />
        <Kpi label="총 vCPU" value={totalVcpu} />
        <Kpi label="총 메모리" value={`${totalRam}GB`} />
        <Kpi label="비용/일" value={`$${totalCost.toFixed(1)}`} />
        <Kpi label="이상 감지" value={anomalyCount} accent={anomalyCount ? "warning" : undefined} />
      </div>

      {/* 전체 관측 개요 */}
      <div className="mt-4 space-y-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">전체 리소스 수요 · 24시간</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                모든 서비스의 종합 부하(util) 평균. 서비스별 상세는 카드를 클릭하세요.
              </p>
            </div>
            <div className="flex items-center gap-6 text-right">
              <div>
                <div className="text-xs text-muted-foreground">현재</div>
                <div className="font-mono text-lg font-semibold text-foreground">{pct(aggDemand[23])}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">피크</div>
                <div className="font-mono text-lg font-semibold text-primary">{pct(Math.max(...aggDemand))}</div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <DemandChart data={aggDemand} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricTile label="전체 평균 CPU" value={pct(avg(aggCpu))} spark={aggCpu} />
          <MetricTile label="전체 평균 메모리" value={pct(avg(aggMem))} spark={aggMem} />
          <MetricTile label="전체 평균 네트워크" value={pct(avg(aggNet))} spark={aggNet} />
        </div>
      </div>

      {/* 서비스 */}
      <div className="mt-8 mb-3">
        <h2 className="text-sm font-medium text-muted-foreground">서비스 · 클릭하면 상세 대시보드</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <ServiceCard key={s.id} s={s} />
        ))}
        <button
          onClick={open}
          className="flex min-h-[10rem] items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground transition-smooth hover:border-primary/50 hover:text-foreground"
        >
          <Plus className="h-4 w-4" /> 새 배포 예측
        </button>
      </div>
    </div>
  )
}
