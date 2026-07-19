import { useParams, useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { DemandChart, MetricTile } from "@/components/observability"
import { useDemo, FLAVOR_SPECS, pct, avg, statusMeta, gateMeta } from "@/demo/store"
import { cn } from "@/lib/utils"
import { ArrowLeft, Github, ExternalLink, Trash2, Server, Cpu } from "lucide-react"

function KV({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-sm text-foreground", mono && "font-mono")}>{children}</div>
    </div>
  )
}

export default function ServiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getService, removeService } = useDemo()
  const s = getService(Number(id))

  if (!s) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-lg font-semibold">서비스를 찾을 수 없어요</h1>
        <p className="mt-2 text-sm text-muted-foreground">삭제되었거나 잘못된 주소일 수 있어요.</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link to="/demo/services">프로젝트로 돌아가기</Link>
        </Button>
      </div>
    )
  }

  const observed = s.metrics.map((m) => m.value)
  const cpu = s.metrics.map((m) => m.cpu_mean)
  const mem = s.metrics.map((m) => m.mem_mean)
  const net = s.metrics.map((m) => m.network_util)
  const spec = FLAVOR_SPECS[s.flavor]
  const gm = gateMeta[s.automation_mode] ?? gateMeta.auto
  const sm = statusMeta[s.status] ?? statusMeta.stopped

  const handleDelete = () => {
    removeService(s.id)
    navigate("/demo/services")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to="/demo/services"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-smooth hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 프로젝트
      </Link>

      {/* 헤더 */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{s.name}</h1>
            <Badge variant="outline" className={cn("shrink-0 font-medium", sm.cls)}>
              {sm.label}
            </Badge>
          </div>
          <a
            href={s.repository}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            <Github className="h-3 w-3" /> {s.repository.replace(/^https?:\/\/github\.com\//, "")}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {s.flavor}
          </Badge>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" /> 삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{s.name}를 삭제할까요?</AlertDialogTitle>
                <AlertDialogDescription>
                  데모에서 이 서비스와 관측 데이터가 제거됩니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* 핵심 지표 */}
      <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-4">
        <KV label="추천 등급" mono>
          {s.flavor}
          {spec && <span className="ml-1 text-muted-foreground">· {spec.vcpu}vCPU {spec.ram}GB</span>}
        </KV>
        <KV label="예상 사용자" mono>
          {s.expected_users.toLocaleString()}
        </KV>
        <KV label="예상 비용" mono>
          ${s.cost_per_day}/day
        </KV>
        <KV label="자동화">
          <Badge variant="outline" className={cn("font-medium", gm.cls)}>
            {gm.label}
          </Badge>
        </KV>
      </div>

      {/* 예측 vs 관측 */}
      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">예측 vs 관측 · 24시간</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              LSTM이 예측한 수요(점선)와 실제 관측된 부하(면). 피크를 놓치지 않게 사이징합니다.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">관측 피크</div>
            <div className="font-mono text-lg font-semibold text-primary">{pct(Math.max(...observed))}</div>
          </div>
        </div>
        <div className="mt-4">
          <DemandChart data={observed} predicted={s.predictions_24h} height={224} />
        </div>
      </div>

      {/* 관측 지표 */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <MetricTile label="CPU 사용률" value={pct(avg(cpu))} spark={cpu} />
        <MetricTile label="메모리 사용률" value={pct(avg(mem))} spark={mem} />
        <MetricTile label="네트워크" value={pct(avg(net))} spark={net} />
      </div>

      {/* 추천 근거 + 인스턴스 */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">추천 근거</h2>
          </div>
          <div className={cn("mt-3 flex items-start gap-2.5 rounded-lg border p-3 text-sm", gm.cls)}>
            <span className="font-medium">{gm.label}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.reasoning}</p>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
            <KV label="서비스 유형" mono>
              {s.service_type}
            </KV>
            <KV label="시간대" mono>
              {s.time_slot}
            </KV>
            <KV label="현재 vCPU/MEM" mono>
              {s.curr_cpu} / {Math.round(s.curr_mem / 1024)}GB
            </KV>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">인스턴스 정보</h2>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">OpenStack에서 생성된 자원 (데모)</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <KV label="Instance ID" mono>
              {s.instance_id}
            </KV>
            <KV label="상태" mono>
              {s.status === "deployed" ? "ACTIVE" : s.status}
            </KV>
            <KV label="이미지" mono>
              {s.image}
            </KV>
            <KV label="네트워크" mono>
              {s.network}
            </KV>
            <KV label="Key Pair" mono>
              {s.key_name}
            </KV>
            <KV label="IP" mono>
              {s.ip}
            </KV>
            {spec && (
              <KV label="스펙" mono>
                {spec.vcpu}vCPU · {spec.ram}GB · {spec.disk}GB
              </KV>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
