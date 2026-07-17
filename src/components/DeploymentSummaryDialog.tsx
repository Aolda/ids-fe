import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DeployResponse } from "@/lib/mcpAPI"
import { PredictResponse } from "@/lib/backendAPI"

export interface DeploymentSummaryData {
  githubUrl: string
  predictResult?: PredictResponse | null
  deployResult: DeployResponse
}

interface DeploymentSummaryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: DeploymentSummaryData
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function DeploymentSummaryDialog({ open, onOpenChange, data }: DeploymentSummaryDialogProps) {
  if (!data) return null

  const { deployResult, predictResult, githubUrl } = data
  const instance = deployResult.instance
  const hasMetadata = instance && instance.metadata && Object.keys(instance.metadata).length > 0
  const addressesEntries = instance ? Object.entries(instance.addresses || {}) : []
  const recommendedFlavor = predictResult?.recommendations?.flavor ?? instance?.flavor_name
  const costPerDay = predictResult?.recommendations?.cost_per_day

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>{deployResult.accepted ? "VM 배포 완료" : "예측 완료 · 배포 보류"}</DialogTitle>
          <DialogDescription>
            {deployResult.accepted
              ? `${githubUrl} 저장소 기반으로 생성된 VM 정보를 한눈에 확인하세요.`
              : `${githubUrl} 예측·추천 결과입니다. 배포는 아직 진행되지 않았습니다.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2 max-h-[70vh] overflow-y-auto pr-1">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">배포 결과</p>
              <Badge variant={deployResult.accepted ? "default" : "destructive"}>
                {deployResult.accepted ? "배포 완료" : "요청 거절"}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {deployResult.message}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-muted-foreground">Plan ID</p>
                <p className="font-medium break-all">{deployResult.plan_id ?? "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Instance ID</p>
                <p className="font-medium break-all">{deployResult.instance_id ?? "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">배포 시각</p>
                <p className="font-medium">{formatDateTime(deployResult.deployed_at)}</p>
              </div>
            </div>
          </section>

          <Separator />

          {instance ? (
            <section className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground">VM 세부 정보</h4>
                <p className="text-xs text-muted-foreground">
                  OpenStack에서 실제로 생성된 자원 정보
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-muted-foreground">VM 이름</p>
                  <p className="font-medium break-all">{instance.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">상태</p>
                  <p className="font-medium">{instance.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Flavor</p>
                  <p className="font-medium">{instance.flavor_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">이미지</p>
                  <p className="font-medium break-all">{instance.image_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">네트워크</p>
                  <p className="font-medium break-all">{instance.network_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Key Pair</p>
                  <p className="font-medium break-all">{instance.key_name}</p>
                </div>
              </div>

              {addressesEntries.length > 0 && (
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground font-medium">네트워크 주소</p>
                  <div className="rounded-md border bg-muted/40 p-3 space-y-3">
                    {addressesEntries.map(([network, entries]) => (
                      <div key={network}>
                        <p className="text-xs uppercase text-muted-foreground mb-1">{network}</p>
                        <div className="space-y-1">
                          {entries.map((entry, idx) => (
                            <div key={`${network}-${idx}`} className="flex flex-wrap justify-between text-xs sm:text-sm">
                              <span className="font-mono break-all">{entry.addr ?? "-"}</span>
                              <span className="text-muted-foreground">
                                {(entry["OS-EXT-IPS:type"] || entry.type || "unknown").toUpperCase()} · IPv{entry.version ?? "?"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasMetadata && (
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground font-medium">메타데이터</p>
                  <div className="rounded-md border bg-muted/40 p-3 space-y-2">
                    {Object.entries(instance.metadata ?? {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-4 text-xs sm:text-sm">
                        <span className="text-muted-foreground">{key}</span>
                        <span className="font-medium break-all">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          ) : (
            <section className="text-sm text-muted-foreground">
              {deployResult.accepted
                ? "OpenStack 인스턴스 세부 정보를 아직 받지 못했습니다. 잠시 후 새로고침해주세요."
                : "배포는 아직 진행되지 않았습니다 (인프라 연동 대기). 위 예측·추천 결과만 표시됩니다."}
            </section>
          )}

          {predictResult && (
            <>
              <Separator />
              <section className="space-y-3 text-sm">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">AI 추천 요약</h4>
                  <p className="text-xs text-muted-foreground">
                    자연어 요구사항을 기반으로 계산된 권장 스펙입니다.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">추천 Flavor</p>
                    <p className="text-lg font-semibold">{recommendedFlavor ?? "미확정"}</p>
                    {costPerDay && (
                      <p className="text-xs text-muted-foreground mt-1">
                        예상 비용: ${costPerDay}/day
                      </p>
                    )}
                  </div>
                  <div className="rounded-md border p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">예상 부하</p>
                    <p className="font-medium">
                      {predictResult.extracted_context.expected_users.toLocaleString()} users ·{" "}
                      {predictResult.extracted_context.time_slot}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {predictResult.extracted_context.curr_cpu} vCPU / {predictResult.extracted_context.curr_mem} MB
                    </p>
                  </div>
                </div>
                {predictResult.extracted_context.reasoning && (
                  <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-md p-3">
                    {predictResult.extracted_context.reasoning}
                  </p>
                )}
              </section>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>확인</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

