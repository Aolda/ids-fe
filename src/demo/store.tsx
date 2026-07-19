/**
 * 데모 데이터 스토어.
 *
 * 중요: 목데이터는 **실 백엔드가 실제로 수집·산출하는 것과 동일한 형태**다.
 *  - MetricPoint = metric_history 한 행(시간당 집계). value = resource_demand_score(util[0,1]),
 *    raw 채널(cpu/mem/net util) + std/max. score 는 실 공식 0.5·cpu + 0.3·mem + 0.2·net 로 계산.
 *  - flavor 는 Aolda 7단계 ladder, automation_mode 는 auto|manual|block.
 * 이렇게 해두면 실 백엔드(/api/v1/plans · metric_history)에 붙일 때 컴포넌트 변경 없이 매핑된다.
 */

import { createContext, useContext, useMemo, useState } from "react"
import { ProjectData } from "@/components/CreateProjectDialog"
import { PredictResponse } from "@/lib/backendAPI"

export const FLAVOR_SPECS: Record<string, { vcpu: number; ram: number; disk: number; use: string }> = {
  "aolda.tiny": { vcpu: 1, ram: 1, disk: 10, use: "실습/테스트" },
  "aolda.small": { vcpu: 1, ram: 2, disk: 20, use: "가벼운 웹서버" },
  "aolda.medium": { vcpu: 2, ram: 4, disk: 40, use: "일반 백엔드" },
  "aolda.large": { vcpu: 4, ram: 8, disk: 80, use: "팀 프로젝트" },
  "aolda.memory": { vcpu: 4, ram: 16, disk: 80, use: "DB·캐시" },
  "aolda.xlarge": { vcpu: 8, ram: 16, disk: 120, use: "고부하 API" },
  "aolda.max": { vcpu: 8, ram: 32, disk: 160, use: "최대(승인)" },
}

export type ServiceStatus = "deployed" | "building" | "error" | "stopped"
export type Gate = "auto" | "manual" | "block"

/** metric_history 한 행과 동일. 모든 util 은 [0,1] (rubric S1). */
export interface MetricPoint {
  ts: string
  value: number // resource_demand_score
  cpu_mean: number
  cpu_max: number
  cpu_std: number
  mem_mean: number
  mem_max: number
  mem_std: number
  network_util: number
  event_flag: 0 | 1
  traffic_boost_factor: number
}

export interface DemoService {
  id: number
  name: string
  repository: string
  status: ServiceStatus
  instance_id: string
  last_deployment: string
  url: string | null
  // 예측/추천 (PredictResponse 유래)
  flavor: string
  automation_mode: Gate
  service_type: string
  time_slot: string
  expected_users: number
  curr_cpu: number
  curr_mem: number
  cost_per_day: number
  reasoning: string
  predictions_24h: number[] // 예측된 24h 수요(util)
  metrics: MetricPoint[] // 관측된 24h(metric_history 형태)
  // 인스턴스 (OpenStack)
  image: string
  network: string
  key_name: string
  ip: string
}

const clamp = (v: number) => Math.max(0, Math.min(1, Number(v.toFixed(3))))
const R = (v: number) => Number(v.toFixed(3))
const score = (cpu: number, mem: number, net: number) => clamp(0.5 * cpu + 0.3 * mem + 0.2 * net)

// 부하 프로파일(24h 형태) — cold-start 프로파일 시딩과 같은 개념의 대표 파형.
type Profile = "steady-low" | "business-peak" | "spiky" | "flat-high"
function profileCurve(kind: Profile): number[] {
  return Array.from({ length: 24 }, (_, h) => {
    const dayPhase = Math.sin(((h - 6) / 24) * 2 * Math.PI) // 오후 피크
    if (kind === "steady-low") return clamp(0.18 + 0.06 * Math.max(0, dayPhase) + Math.sin(h) * 0.02)
    if (kind === "flat-high") return clamp(0.68 + 0.08 * dayPhase + Math.sin(h * 1.3) * 0.03)
    if (kind === "spiky") {
      const spike = h === 13 || h === 19 ? 0.35 : 0
      return clamp(0.32 + 0.15 * Math.max(0, dayPhase) + spike)
    }
    // business-peak
    return clamp(0.28 + 0.42 * Math.max(0, dayPhase))
  })
}

/**
 * 부하 곡선 → metric_history 형태 24행. value 는 실 score 공식으로 계산.
 * 예측 곡선을 load 로 넘기면, score 공식(0.856·load+0.03)의 압축으로 관측 value 가 예측보다
 * 약간 낮게 나와 "예측 ≥ 관측(피크를 놓치지 않는다)"이 자연스럽게 성립한다.
 */
function genMetricsFromCurve(
  load: number[],
  endMs: number,
  opts: { eventAt?: number; boost?: number } = {},
): MetricPoint[] {
  return load.map((l, i) => {
    const cpu = clamp(l + (Math.random() - 0.5) * 0.04)
    const mem = clamp(l * 0.82 + 0.1 + (Math.random() - 0.5) * 0.03)
    const net = clamp(l * 0.55 + (Math.random() - 0.5) * 0.03)
    const ts = new Date(endMs - (23 - i) * 3600_000).toISOString()
    return {
      ts,
      value: score(cpu, mem, net),
      cpu_mean: cpu,
      cpu_max: clamp(cpu + 0.06 + Math.random() * 0.05),
      cpu_std: R(0.02 + Math.random() * 0.03),
      mem_mean: mem,
      mem_max: clamp(mem + 0.05),
      mem_std: R(0.02 + Math.random() * 0.02),
      network_util: net,
      event_flag: opts.eventAt === i ? 1 : 0,
      traffic_boost_factor: opts.boost ?? 1.0,
    }
  })
}

/** 입력 자연어 → 실 PredictResponse 형태(대화상자 흐름에서 사용). */
export function synthPredict(data: ProjectData): PredictResponse {
  const t = data.requirements.toLowerCase()
  const heavy = /수천|수만|이벤트|출시|피크|몰|고가용|많|db|데이터베이스|캐시/.test(t)
  const light = /개인|간단|가벼|작|소규모|블로그|포트폴리오/.test(t)
  const isDb = /db|데이터베이스|캐시|redis|postgres|mysql/.test(t)
  const users = heavy ? 3200 : light ? 80 : 520
  const flavor = isDb ? "aolda.memory" : heavy ? "aolda.xlarge" : light ? "aolda.small" : "aolda.medium"
  const gate: Gate = heavy || isDb ? "manual" : "auto"
  const peak = heavy ? 0.86 : light ? 0.33 : 0.62
  const cost = FLAVOR_SPECS[flavor] ? FLAVOR_SPECS[flavor].ram * 0.35 + FLAVOR_SPECS[flavor].vcpu * 0.4 : 2.8
  const series = profileCurve(heavy ? "flat-high" : light ? "steady-low" : "business-peak").map((v) =>
    clamp(v * (peak / 0.62)),
  )
  return {
    success: true,
    github_info: {},
    extracted_context: {
      service_type: isDb ? "db" : /api|백엔드|서버/.test(t) ? "api" : "web",
      expected_users: users,
      time_slot: heavy ? "peak" : "normal",
      runtime_env: "prod",
      curr_cpu: FLAVOR_SPECS[flavor]?.vcpu ?? 2,
      curr_mem: (FLAVOR_SPECS[flavor]?.ram ?? 4) * 1024,
      reasoning: "데모 · 입력 문장에서 규모·피크를 추정한 합성 예측입니다.",
    },
    predictions: { values_24h: series },
    recommendations: {
      flavor,
      cost_per_day: R(cost),
      notes:
        gate === "manual"
          ? "피크 수요가 커서 자동배포 전 검토를 권장합니다 (데모)."
          : "예상 부하가 단일 VM 여유 안에 들어옵니다 (데모).",
    },
    automation_mode: gate,
    extraction_status: "complete",
    context_confidence: 0.9,
    missing_fields: [],
    question: null,
    predictions_24h: series,
  }
}

/** PredictResponse + 관측 metric 을 묶어 하나의 DemoService 로. */
export function serviceFromPredict(id: number, data: ProjectData, p: PredictResponse): DemoService {
  const name = data.github_repo_url.replace(/\/$/, "").split("/").pop() || "new-service"
  const ctx = p.extracted_context
  const now = Date.now()
  // 관측 metric 은 예측 곡선에서 파생 → 예측·관측이 같은 파형이고 예측이 관측보다 약간 위(피크 안전).
  const predicted = p.predictions_24h && p.predictions_24h.length ? p.predictions_24h : profileCurve("business-peak")
  const idHex = id.toString(16).padStart(4, "0").slice(-4)
  return {
    id,
    name,
    repository: data.github_repo_url,
    status: "deployed",
    instance_id: `vm-${idHex}`,
    last_deployment: new Date(now).toISOString(),
    url: null,
    flavor: p.recommendations?.flavor ?? "aolda.medium",
    automation_mode: (p.automation_mode as Gate) ?? "auto",
    service_type: ctx.service_type,
    time_slot: ctx.time_slot,
    expected_users: ctx.expected_users,
    curr_cpu: ctx.curr_cpu,
    curr_mem: ctx.curr_mem,
    cost_per_day: p.recommendations?.cost_per_day ?? 0,
    reasoning: ctx.reasoning ?? "",
    predictions_24h: predicted,
    metrics: genMetricsFromCurve(predicted, now),
    image: "ubuntu-22.04",
    network: "aolda-net",
    key_name: "aolda-key",
    ip: `10.0.3.${20 + (id % 200)}`,
  }
}

// ── seed services (실 데이터 형태) ─────────────────────────────
function seedService(
  id: number,
  name: string,
  repo: string,
  flavor: string,
  kind: Profile,
  opts: Partial<DemoService> = {},
): DemoService {
  const now = Date.now()
  const predicted = profileCurve(kind)
  const metrics = genMetricsFromCurve(predicted, now, kind === "spiky" ? { eventAt: 19, boost: 1.3 } : {})
  const spec = FLAVOR_SPECS[flavor]
  return {
    id,
    name,
    repository: repo,
    status: "deployed",
    instance_id: `vm-${(1000 + id).toString(16)}`,
    last_deployment: new Date(now - id * 3600_000 * 6).toISOString(),
    url: null,
    flavor,
    automation_mode: kind === "flat-high" ? "manual" : "auto",
    service_type: name.includes("api") ? "api" : name.includes("db") || kind === "spiky" ? "db" : "web",
    time_slot: kind === "flat-high" ? "peak" : "normal",
    expected_users: kind === "flat-high" ? 3000 : kind === "steady-low" ? 90 : 540,
    curr_cpu: spec.vcpu,
    curr_mem: spec.ram * 1024,
    cost_per_day: R(spec.ram * 0.35 + spec.vcpu * 0.4),
    reasoning: "데모 · 대표 워크로드 프로파일 기반 추천.",
    predictions_24h: predicted,
    metrics,
    image: "ubuntu-22.04",
    network: "aolda-net",
    key_name: "aolda-key",
    ip: `10.0.3.${20 + id}`,
    ...opts,
  }
}

function seedServices(): DemoService[] {
  return [
    seedService(1, "shop-api", "https://github.com/team/shop-api", "aolda.medium", "business-peak", {
      url: "https://shop-api.aolda.dev",
    }),
    seedService(2, "portfolio-web", "https://github.com/jane/portfolio-web", "aolda.small", "steady-low"),
    seedService(3, "orders-db", "https://github.com/team/orders-db", "aolda.memory", "spiky"),
    seedService(4, "ml-batch", "https://github.com/lab/ml-batch", "aolda.xlarge", "flat-high", {
      status: "building",
    }),
  ]
}

// ── Context ────────────────────────────────────────────────────
interface DemoContextValue {
  services: DemoService[]
  getService: (id: number) => DemoService | undefined
  addFromPredict: (data: ProjectData, predict: PredictResponse) => DemoService
  removeService: (id: number) => void
}

const DemoContext = createContext<DemoContextValue | undefined>(undefined)

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<DemoService[]>(() => seedServices())

  const value = useMemo<DemoContextValue>(
    () => ({
      services,
      getService: (id) => services.find((s) => s.id === id),
      addFromPredict: (data, predict) => {
        const id = Date.now()
        const svc = serviceFromPredict(id, data, predict)
        setServices((prev) => [svc, ...prev.filter((p) => p.repository !== svc.repository)])
        return svc
      },
      removeService: (id) => setServices((prev) => prev.filter((s) => s.id !== id)),
    }),
    [services],
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error("useDemo must be used within DemoProvider")
  return ctx
}

// 공용 헬퍼
export const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0)
export const pct = (v: number) => `${Math.round(v * 100)}%`
export const statusMeta: Record<ServiceStatus, { label: string; cls: string }> = {
  deployed: { label: "배포됨", cls: "bg-success/10 text-success border-success/20" },
  building: { label: "빌드 중", cls: "bg-primary/10 text-primary border-primary/20" },
  error: { label: "오류", cls: "bg-destructive/10 text-destructive border-destructive/20" },
  stopped: { label: "중지됨", cls: "bg-muted text-muted-foreground border-border" },
}
export const gateMeta: Record<Gate, { label: string; cls: string }> = {
  auto: { label: "자동 배포", cls: "bg-success/10 text-success border-success/20" },
  manual: { label: "검토 후 배포", cls: "bg-warning/10 text-warning border-warning/20" },
  block: { label: "배포 불가", cls: "bg-destructive/10 text-destructive border-destructive/20" },
}
