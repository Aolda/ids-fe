import { cn } from "@/lib/utils"

/* launcha 로고 마크 — 우상향 신호 획(예측→상승)을 형상화한 글리프.
   한 곳에서만 정의해 세 화면(랜딩·로그인·네비)에서 동일하게 쓴다. */
export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground",
        className
      )}
    >
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth={2.4}>
        <path d="M4 15l5-5 3 3 7-8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 5h4v4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
