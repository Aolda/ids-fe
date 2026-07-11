import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Cpu, MemoryStick, TrendingUp } from "lucide-react"

/* ── 목업 데이터 (백엔드 배선 전까지 데모용) ───────────────────
   score = resource_demand_score (util 0~1), 저녁 피크. */
const prediction = [
  0.28, 0.24, 0.21, 0.19, 0.2, 0.26, 0.35, 0.48, 0.57, 0.61, 0.59, 0.63, 0.68,
  0.66, 0.62, 0.6, 0.64, 0.71, 0.79, 0.86, 0.9, 0.83, 0.62, 0.4,
].map((score, h) => ({ label: `${String(h).padStart(2, "0")}:00`, score }))
const peakIdx = prediction.reduce((m, d, i, a) => (d.score > a[m].score ? i : m), 0)

const cpuObserved = [45, 32, 38, 41, 52, 61, 74, 67, 58, 63, 71, 56].map((v, i) => ({
  label: `${i * 2}:00`,
  value: v,
}))
const memObserved = [62, 58, 60, 65, 71, 78, 85, 82, 74, 77, 81, 73].map((v, i) => ({
  label: `${i * 2}:00`,
  value: v,
}))

type TipProps = {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  unit?: string
  fractionDigits?: number
}

function ChartTooltip({ active, payload, label, unit = "", fractionDigits = 0 }: TipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lift">
      <div className="font-mono text-[11px] text-muted-foreground">{label}</div>
      <div className="tabular text-sm font-semibold text-foreground">
        {payload[0].value.toFixed(fractionDigits)}
        {unit}
      </div>
    </div>
  )
}

/* 시그니처 차트 — 24시간 리소스 수요 예측 (단일 시계열, 피크 마커) */
export function PredictionChart() {
  const peak = prediction[peakIdx]
  return (
    <Card className="border-border shadow-card">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="h-4 w-4 text-primary" />
            리소스 수요 예측 · 24H
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            resource_demand_score · util[0–1] · 피크에 맞춰 등급을 잡습니다
          </p>
        </div>
        <div className="text-right">
          <div className="eyebrow">예측 피크</div>
          <div className="tabular text-xl font-semibold text-primary">{peak.score.toFixed(2)}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="h-[240px]"
          role="img"
          aria-label={`24시간 리소스 수요 예측, 예측 피크 ${peak.score.toFixed(2)}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={prediction} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id="predFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="hsl(var(--grid-line))" />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval={3}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 1]}
                ticks={[0, 0.5, 1]}
              />
              <Tooltip
                content={<ChartTooltip fractionDigits={2} />}
                cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.4, strokeDasharray: "4 4" }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#predFill)"
              />
              <ReferenceDot
                x={peak.label}
                y={peak.score}
                r={4}
                fill="hsl(var(--primary))"
                stroke="hsl(var(--card))"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function ObservedCard({
  title,
  icon,
  data,
  current,
  color,
}: {
  title: string
  icon: React.ReactNode
  data: { label: string; value: number }[]
  current: number
  color: string
}) {
  return (
    <Card className="border-border shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </CardTitle>
        <div className="text-xs text-muted-foreground">
          현재 <span className="tabular font-semibold" style={{ color }}>{current}%</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[120px]" role="img" aria-label={`${title}, 현재 ${current}%`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--grid-line))" />
              <XAxis dataKey="label" hide />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} ticks={[0, 50, 100]} />
              <Tooltip
                content={<ChartTooltip unit="%" />}
                cursor={{ stroke: color, strokeOpacity: 0.4, strokeDasharray: "4 4" }}
              />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

/* 관측(실측) 지표 — CPU / Memory 스몰 멀티플 (카드당 단일 시계열) */
export function ObservedCharts() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ObservedCard
        title="CPU 사용률"
        icon={<Cpu className="h-4 w-4 text-primary" />}
        data={cpuObserved}
        current={56}
        color="hsl(var(--primary))"
      />
      <ObservedCard
        title="메모리 사용률"
        icon={<MemoryStick className="h-4 w-4 text-primary" />}
        data={memObserved}
        current={73}
        color="hsl(var(--primary))"
      />
    </div>
  )
}

/* 하위 호환용 기본 export (기존 import 유지) */
export function ResourceChart() {
  return (
    <div className="space-y-6">
      <PredictionChart />
      <ObservedCharts />
    </div>
  )
}
