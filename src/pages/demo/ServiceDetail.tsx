import { useState } from "react"
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
import { DemandChart } from "@/components/observability"
import {
  useDemo,
  FLAVOR_SPECS,
  pct,
  avg,
  percentile,
  resizeAdvice,
  anomaliesOf,
  statusMeta,
  gateMeta,
} from "@/demo/store"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Github,
  ExternalLink,
  Trash2,
  Server,
  Cpu,
  Gauge,
  TrendingUp,
  TrendingDown,
  Check,
  AlertTriangle,
  ShieldCheck,
  Terminal,
  Copy,
} from "lucide-react"

function KV({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-sm text-foreground", mono && "font-mono")}>{children}</div>
    </div>
  )
}

function MetricChartCard({ title, series }: { title: string; series: number[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">{title}</span>
        <span className="font-mono text-xs text-muted-foreground">
          평균 <span className="text-foreground">{pct(avg(series))}</span> · 피크{" "}
          <span className="text-primary">{pct(Math.max(...series))}</span>
        </span>
      </div>
      <div className="mt-2">
        <DemandChart data={series} height={128} />
      </div>
    </div>
  )
}

function CopyCmd({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
      <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-foreground">{cmd}</code>
      <button
        type="button"
        aria-label="명령어 복사"
        onClick={() => {
          navigator.clipboard?.writeText(cmd)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
        className="shrink-0 text-muted-foreground transition-smooth hover:text-foreground"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
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
  const p90 = percentile(observed, 0.9)
  const peak = Math.max(...observed)
  const spec = FLAVOR_SPECS[s.flavor]
  const gm = gateMeta[s.automation_mode] ?? gateMeta.auto
  const sm = statusMeta[s.status] ?? statusMeta.stopped
  const advice = resizeAdvice(s.flavor, p90)
  const anomalies = anomaliesOf(s.metrics)
  const headroom = Math.max(0, 1 - peak) // 피크 대비 남은 여유

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
                <AlertDialogDescription>데모에서 이 서비스와 관측 데이터가 제거됩니다.</AlertDialogDescription>
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
      <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-5">
        <KV label="추천 등급" mono>
          {s.flavor}
          {spec && <span className="ml-1 text-muted-foreground">· {spec.vcpu}vCPU {spec.ram}GB</span>}
        </KV>
        <KV label="관측 p90" mono>
          {pct(p90)}
        </KV>
        <KV label="관측 피크" mono>
          <span className="text-primary">{pct(peak)}</span>
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
              LSTM이 예측한 수요(점선)와 실제 관측된 부하(면). 예측이 관측을 위에서 감싸 피크를 놓치지 않습니다.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <DemandChart data={observed} predicted={s.predictions_24h} height={224} />
        </div>
      </div>

      {/* CPU / 메모리 / 네트워크 (이 서비스) */}
      <div className="mt-4">
        <div className="mb-3 text-sm font-medium text-muted-foreground">이 서비스의 리소스 · 24시간</div>
        <div className="grid gap-4 lg:grid-cols-3">
          <MetricChartCard title="CPU 사용률" series={cpu} />
          <MetricChartCard title="메모리 사용률" series={mem} />
          <MetricChartCard title="네트워크" series={net} />
        </div>
      </div>

      {/* 리사이징 추천 + 이상 감지 */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">적정 등급 (관측 기반 재추천)</h2>
          </div>
          {advice.dir === "ok" ? (
            <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-success/30 bg-success/5 p-3 text-sm">
              <Check className="h-4 w-4 shrink-0 text-success" />
              <span className="font-medium text-foreground">
                현재 <span className="font-mono">{s.flavor}</span> 등급이 적정합니다
              </span>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
              {advice.dir === "up" ? (
                <TrendingUp className="h-4 w-4 shrink-0 text-warning" />
              ) : (
                <TrendingDown className="h-4 w-4 shrink-0 text-warning" />
              )}
              <span className="font-medium text-foreground">
                <span className="font-mono">{s.flavor}</span> →{" "}
                <span className="font-mono text-primary">{advice.rec}</span>{" "}
                {advice.dir === "up" ? "상향" : "하향"} 권장
              </span>
            </div>
          )}
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{advice.reason}</p>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
            <KV label="관측 p90" mono>
              {pct(p90)}
            </KV>
            <KV label="피크 여유" mono>
              {pct(headroom)}
            </KV>
            <KV label="예상 사용자" mono>
              {s.expected_users.toLocaleString()}
            </KV>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">이상 감지</h2>
          </div>
          {anomalies.length === 0 ? (
            <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
              최근 24시간 이상 없음
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {anomalies.map((a, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm"
                >
                  <span className="flex items-center gap-2 text-foreground">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                    트래픽 급증 감지
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {a.hoursAgo}시간 전 · 부하 {pct(a.value)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            metric_history 의 event_flag 로 감지 · 이상 시 opensre RCA + Discord 알림 (실 서비스).
          </p>
        </div>
      </div>

      {/* 추천 근거 + 인스턴스 */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">추천 근거</h2>
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

      {/* 접속 가이드 */}
      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">접속 가이드</h2>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Ubuntu 22.04 기반 VM 입니다. 등록한 SSH 키로 직접 접속·제어할 수 있어요.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div>
            <div className="mb-1.5 text-xs font-medium text-muted-foreground">1. SSH 접속</div>
            <CopyCmd cmd={`ssh -i ~/.ssh/your-key ubuntu@${s.ip}`} />
          </div>
          <div>
            <div className="mb-1.5 text-xs font-medium text-muted-foreground">2. 실행 중인 컨테이너 확인</div>
            <CopyCmd cmd="docker ps" />
          </div>
          <div>
            <div className="mb-1.5 text-xs font-medium text-muted-foreground">3. 로그 실시간 보기</div>
            <CopyCmd cmd={`docker logs -f ${s.name}`} />
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <div>
            <span className="font-medium text-foreground">보안</span> — SSH 개인키·OpenStack 자격증명·API 키는
            전부 백엔드에만 있고 이 화면엔 <strong className="text-foreground">절대 노출되지 않습니다</strong>. 여기
            보이는 건 공개 정보(IP·Instance ID·키페어 이름)뿐이에요. 접속은 본인이 등록한 SSH 키로 합니다.
          </div>
        </div>
      </div>
    </div>
  )
}
