// 관측(observability) 차트 — metric_history 에 쌓일 per-VM CPU/메모리/부하(util[0,1])를 보여준다.
// 단일 hue(시그널 시안) sequential — 전부 같은 [0,1] 스케일이라 카테고리 팔레트가 필요 없다.
// 라인/영역만 색을 입고, 값·라벨은 텍스트 토큰을 쓴다(색으로 정체성을 만들지 않음).

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "@/lib/utils"

interface Row {
  h: number
  v: number
  p?: number
}
interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: Row }>
}

function DemandTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-card">
      <div className="text-muted-foreground">{row.h === 23 ? "지금" : `${23 - row.h}시간 전`}</div>
      <div className="mt-0.5 font-mono font-medium text-foreground">관측 {Math.round(row.v * 100)}%</div>
      {row.p != null && (
        <div className="mt-0.5 font-mono text-muted-foreground">예측 {Math.round(row.p * 100)}%</div>
      )}
    </div>
  )
}

// 24시간 리소스 수요(util) 영역 차트 — 축·툴팁·피크 마커. predicted 를 주면 예측선(점선)을 겹쳐 보여준다.
export function DemandChart({
  data,
  predicted,
  height = 208,
}: {
  data: number[]
  predicted?: number[]
  height?: number
}) {
  const rows: Row[] = data.map((v, h) => ({ h, v, p: predicted?.[h] }))
  const peak = rows.reduce((m, d, i, a) => (d.v > a[m].v ? i : m), 0)
  return (
    <>
      {predicted && (
        <div className="mb-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded bg-primary" /> 관측
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t border-dashed border-primary" /> 예측
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="demandFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
          <XAxis
            dataKey="h"
            tickLine={false}
            axisLine={false}
            interval={5}
            tickFormatter={(h) => (h === 23 ? "지금" : `-${23 - h}h`)}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            domain={[0, 1]}
            width={44}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            content={<DemandTooltip />}
            cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.4, strokeDasharray: "3 3" }}
          />
          {predicted && (
            <Area
              type="monotone"
              dataKey="p"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              strokeOpacity={0.7}
              fill="none"
              isAnimationActive={false}
            />
          )}
          <Area
            type="monotone"
            dataKey="v"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#demandFill)"
            isAnimationActive={false}
          />
          <ReferenceDot
            x={rows[peak].h}
            y={rows[peak].v}
            r={4}
            fill="hsl(var(--primary))"
            stroke="hsl(var(--card))"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </>
  )
}

// 카드/타일용 미니 스파크라인 — 값은 옆 텍스트에 있으므로 스크린리더에선 숨긴다.
export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const rows = data.map((v, i) => ({ i, v }))
  return (
    <div className={cn("h-8 w-full", className)} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[0, 1]} />
          <Area
            type="monotone"
            dataKey="v"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            fill="url(#sparkFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// 현재 지표 + 미니 트렌드 타일 (CPU/메모리/네트워크 같은 단일 지표).
export function MetricTile({ label, value, spark }: { label: string; value: string; spark: number[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-xl font-semibold tracking-tight text-foreground">{value}</div>
      <div className="mt-2">
        <Sparkline data={spark} />
      </div>
    </div>
  )
}
