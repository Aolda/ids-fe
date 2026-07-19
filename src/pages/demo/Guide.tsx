import { Link } from "react-router-dom"
import { FLAVOR_SPECS } from "@/demo/store"
import { Github, Sparkles, Rocket, ShieldCheck, HelpCircle, ArrowRight } from "lucide-react"

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

const STEPS = [
  { icon: Github, title: "GitHub 주소 + 한 문장", body: "저장소 주소와 “어떤 서비스인지”만 자연어로 적으면 돼요. 인프라 용어는 몰라도 됩니다." },
  { icon: Sparkles, title: "예측 결과 확인", body: "24시간 부하를 예측해 알맞은 VM 등급·예상 비용을 보여드려요. 검토하고 승인하면 됩니다." },
  { icon: Rocket, title: "자동 배포", body: "VM 생성부터 앱 빌드·실행·상태 확인까지 자동으로. 접속·설치를 직접 할 필요가 없어요." },
]

const GLOSSARY = [
  { term: "부하 (util)", desc: "자원을 얼마나 쓰는지 0~100%로 나타낸 값. 100%에 가까울수록 꽉 찬 상태예요." },
  { term: "관측 피크 / p90", desc: "24시간 중 가장 높았던 부하(피크)와, 상위 10% 지점(p90). 이 피크를 놓치지 않게 등급을 정합니다." },
  { term: "CPU / 메모리 / 네트워크", desc: "각각 연산·기억공간·통신을 얼마나 쓰는지. 셋을 합쳐 종합 부하를 계산해요." },
  { term: "자동 / 검토 / 배포 불가", desc: "예측이 확실하면 자동 배포, 애매하거나 위험하면 사람 검토, 용량이 안 되면 배포를 막습니다." },
  { term: "리사이징 권장", desc: "실제 부하를 보고 “한 단계 낮춰도 돼요(비용↓)” 또는 “올리는 게 안전해요”를 제안하는 것." },
]

const FAQ = [
  { q: "Dockerfile이 없어도 배포되나요?", a: "네. Dockerfile이 있으면 그대로 쓰고, 없으면 Railpack이 저장소를 분석해 빌드를 자동 생성합니다." },
  { q: "배포한 서비스에 어떻게 들어가나요?", a: "기본은 접속이 필요 없어요(자동 배포·관측). 보안상 SSH(22번)는 닫혀 있고, 직접 제어가 필요하면 본인 SSH 키를 등록해 여는 옵트인 방식입니다." },
  { q: "비용이 드나요?", a: "학교(아올다) 클라우드라 비용은 상징적이에요. 다만 자원을 아끼려고, 부하를 보고 낮춰도 되는 등급을 자동 제안합니다." },
  { q: "갑자기 사람이 몰리면요?", a: "평균이 아니라 피크(p90)를 기준으로 사이징해서, 잠깐 몰려도 느려지지 않게 여유를 둡니다." },
]

export default function Guide() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">시작하기</h1>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          인프라를 몰라도 괜찮아요. GitHub 주소와 한 문장이면 예측부터 배포·관측까지 대신 해드립니다. 아래만 알면 충분해요.
        </p>
      </div>

      <div className="space-y-6">
        <Section title="어떻게 배포하나요?" desc="세 단계면 끝나요.">
          <div className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{i + 1}단계</span>
                </div>
                <div className="mt-3 font-medium">{s.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="등급(사양)이 뭔가요?" desc="서비스 규모에 맞는 VM 크기예요. 우리가 자동으로 골라주지만, 뜻은 알아두면 좋아요.">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="py-2 text-left font-medium">등급</th>
                  <th className="py-2 text-left font-medium">vCPU · RAM · 디스크</th>
                  <th className="py-2 text-left font-medium">이런 서비스에</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(FLAVOR_SPECS).map(([name, s]) => (
                  <tr key={name} className="border-t border-border">
                    <td className="py-2.5 font-mono">{name}</td>
                    <td className="py-2.5 font-mono text-muted-foreground">
                      {s.vcpu} · {s.ram}GB · {s.disk}GB
                    </td>
                    <td className="py-2.5 text-muted-foreground">{s.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="배포한 서비스에 어떻게 접근하나요?">
          <div className="flex items-start gap-2.5 rounded-lg border border-success/30 bg-success/5 p-3 text-sm">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <div className="text-muted-foreground">
              <span className="font-medium text-foreground">기본은 접속이 필요 없어요.</span> 배포·빌드·실행·상태 확인을 IDS가
              대신 하고, 결과는 서비스 대시보드에서 봅니다. 보안을 위해 SSH는 닫혀 있고, 직접 제어가 필요하면 본인 SSH 키를
              등록해 여는 옵트인 방식입니다.
            </div>
          </div>
        </Section>

        <Section title="이 숫자들이 뭔가요?" desc="대시보드에서 보이는 용어를 쉽게 풀었어요.">
          <dl className="divide-y divide-border">
            {GLOSSARY.map((g) => (
              <div key={g.term} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                <dt className="font-medium">{g.term}</dt>
                <dd className="text-sm text-muted-foreground">{g.desc}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="자주 묻는 질문">
          <div className="space-y-4">
            {FAQ.map((f) => (
              <div key={f.q}>
                <div className="flex items-center gap-1.5 font-medium">
                  <HelpCircle className="h-4 w-4 text-primary" /> {f.q}
                </div>
                <p className="mt-1 pl-6 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </Section>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
          <p className="text-sm text-muted-foreground">이제 직접 해볼까요?</p>
          <Link
            to="/demo"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-smooth hover:opacity-90"
          >
            대시보드로 가서 새 배포 예측 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
