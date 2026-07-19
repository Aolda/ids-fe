import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { DemandChart } from "@/components/observability"
import { useDemo, CLUSTER_CAPACITY, clusterUsage, FLAVOR_SPECS, avg, pct, MetricPoint } from "@/demo/store"
import { cn } from "@/lib/utils"
import { Cpu, MemoryStick, Server, ChevronRight } from "lucide-react"

function CapacityBar({ label, icon: Icon, used, total, unit }: {
  label: string
  icon: React.ElementType
  used: number
  total: number
  unit: string
}) {
  const p = total ? Math.min(1, used / total) : 0
  const warn = p > 0.8
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-4 w-4" /> {label}
        </span>
        <span className="font-mono text-foreground">
          {used}
          {unit} / {total}
          {unit} <span className="text-muted-foreground">({Math.round(p * 100)}%)</span>
        </span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", warn ? "bg-warning" : "bg-primary")}
          style={{ width: `${p * 100}%` }}
        />
      </div>
    </div>
  )
}

export default function Cluster() {
  const { services } = useDemo()
  const u = clusterUsage(services)

  const at = (h: number, pick: (m: MetricPoint) => number) =>
    avg(services.map((s) => pick(s.metrics[h] ?? s.metrics[s.metrics.length - 1])))
  const aggDemand = Array.from({ length: 24 }, (_, h) => at(h, (m) => m.value))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">아올다 클러스터</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          학교 클라우드는 용량이 고정된 소규모 자원이에요. 지금 얼마나 쓰고 있고 얼마나 남았는지 보여드립니다.
        </p>
      </div>

      {services.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <Server className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            배포된 서비스가 없어 클러스터 사용량이 없습니다. 새 배포 예측을 하면 여기 채워져요.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 용량 */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold">자원 사용량</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">배포된 서비스가 차지한 vCPU·메모리·슬롯</p>
          <div className="mt-5 space-y-4">
            <CapacityBar label="vCPU" icon={Cpu} used={u.usedVcpu} total={CLUSTER_CAPACITY.vcpu} unit="" />
            <CapacityBar label="메모리" icon={MemoryStick} used={u.usedRam} total={CLUSTER_CAPACITY.ram} unit="GB" />
            <CapacityBar label="VM 슬롯" icon={Server} used={u.slotsUsed} total={CLUSTER_CAPACITY.slots} unit="" />
          </div>
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <div>
              남은 여유: <span className="font-mono text-foreground">{u.freeVcpu} vCPU · {u.freeRam}GB</span>. 배포 전에
              용량을 확인해서, 자리가 없으면 배포를 막고(over-provision 방지) 단일 VM은 전체의 40%를 넘지 못하게 제한합니다(S7/S8).
            </div>
          </div>
        </div>

        {/* 전체 부하 */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold">전체 부하 · 24시간</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">모든 서비스 종합 부하(util)</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">피크</div>
              <div className="font-mono text-lg font-semibold text-primary">{pct(Math.max(...aggDemand))}</div>
            </div>
          </div>
          <div className="mt-4">
            <DemandChart data={aggDemand} height={188} />
          </div>
        </div>
      </div>

      {/* 서비스별 할당 */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border bg-muted/40 px-4 py-3 text-sm font-medium text-muted-foreground">
          서비스별 자원 할당
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">서비스</th>
                <th className="px-4 py-2.5 text-left font-medium">등급</th>
                <th className="px-4 py-2.5 text-right font-medium">vCPU</th>
                <th className="px-4 py-2.5 text-right font-medium">메모리</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => {
                const spec = FLAVOR_SPECS[s.flavor]
                return (
                  <tr key={s.id} className="border-t border-border transition-smooth hover:bg-accent/30">
                    <td className="px-4 py-2.5">
                      <Link
                        to={`/demo/services/${s.id}`}
                        className="inline-flex items-center gap-1 font-medium hover:text-primary"
                      >
                        {s.name} <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className="font-mono text-xs">
                        {s.flavor}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">{spec?.vcpu ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{spec ? `${spec.ram}GB` : "—"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
