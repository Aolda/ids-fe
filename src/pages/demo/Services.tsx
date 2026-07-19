import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ServiceCard } from "@/pages/demo/ServiceCard"
import { useDemo } from "@/demo/store"
import { useNewPrediction } from "@/demo/DemoLayout"
import { Plus, Search, Boxes } from "lucide-react"

export default function Services() {
  const { services } = useDemo()
  const { open } = useNewPrediction()
  const [q, setQ] = useState("")

  const filtered = services.filter((s) => {
    const t = q.toLowerCase()
    return s.name.toLowerCase().includes(t) || s.repository.toLowerCase().includes(t)
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">프로젝트</h1>
          <p className="mt-1 text-sm text-muted-foreground">배포한 서비스를 관리하고 상태를 확인하세요.</p>
        </div>
        <Button size="sm" onClick={open}>
          <Plus className="h-4 w-4" /> 새 배포 예측
        </Button>
      </div>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="이름 또는 저장소로 검색"
          className="pl-10"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Boxes className="h-5 w-5" />
          </div>
          <h3 className="font-semibold">{q ? "검색 결과가 없어요" : "아직 서비스가 없어요"}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {q ? "다른 검색어를 시도해보세요." : "새 배포 예측으로 첫 서비스를 만들어보세요."}
          </p>
          {!q && (
            <Button size="sm" className="mt-4" onClick={open}>
              <Plus className="h-4 w-4" /> 새 배포 예측
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <ServiceCard key={s.id} s={s} />
          ))}
        </div>
      )}
    </div>
  )
}
