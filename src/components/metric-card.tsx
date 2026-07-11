import { cn } from "@/lib/utils"
import { useCountUp } from "@/hooks/use-count-up"
import { TrendingUp, TrendingDown } from "lucide-react"

function CountUp({ value }: { value: number }) {
  const n = useCountUp(value)
  const display = Number.isInteger(value) ? Math.round(n) : Number(n.toFixed(2))
  return <>{display.toLocaleString()}</>
}

interface MetricCardProps {
  title: string
  value: string | number
  /** 값 아래 한 줄 맥락 (예: "지난 24시간"). 가짜 증감률 대신 정직한 라벨. */
  hint?: string
  /** 선택적 추세 배지 — 실제 비교 대상이 있을 때만 쓴다. */
  change?: {
    value: number
    type: "increase" | "decrease" | "neutral"
  }
  icon: React.ReactNode
  className?: string
}

export function MetricCard({ title, value, hint, change, icon, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        "group rounded-xl border border-border bg-card p-5 transition-smooth hover:border-primary/40 hover:shadow-card",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <span className="text-muted-foreground/70 transition-smooth group-hover:text-primary">
          {icon}
        </span>
      </div>

      <div className="mt-3 tabular text-2xl font-semibold tracking-tight text-foreground">
        {typeof value === "number" ? (
          <>
            {/* 애니메이션 중에도 스크린리더는 항상 최종값을 읽는다 */}
            <span className="sr-only">{value.toLocaleString()}</span>
            <span aria-hidden="true">
              {value >= 10 ? <CountUp value={value} /> : value.toLocaleString()}
            </span>
          </>
        ) : (
          value
        )}
      </div>

      {change ? (
        <div
          className={cn(
            "mt-2 flex items-center gap-1 text-xs",
            change.type === "increase" && "text-success",
            change.type === "decrease" && "text-destructive",
            change.type === "neutral" && "text-muted-foreground"
          )}
        >
          {change.type === "increase" && <TrendingUp className="h-3.5 w-3.5" />}
          {change.type === "decrease" && <TrendingDown className="h-3.5 w-3.5" />}
          <span className="tabular">
            {change.value > 0 ? "+" : ""}
            {change.value}%
          </span>
          {hint && <span className="text-muted-foreground">· {hint}</span>}
        </div>
      ) : hint ? (
        <div className="mt-2 text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  )
}
