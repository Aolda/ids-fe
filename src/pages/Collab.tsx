import { useState } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { CollabProvider, useCollab } from "@/collab/CollabContext"
import { TaskStatus } from "@/collab/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  ListTodo,
  StickyNote,
  MessagesSquare,
  Plus,
  Trash2,
  Info,
  Lock,
  Users,
} from "lucide-react"

type ViewKey = "tasks" | "notes" | "chat"

const VIEWS: { key: ViewKey; label: string; icon: React.ElementType }[] = [
  { key: "tasks", label: "할 일", icon: ListTodo },
  { key: "notes", label: "메모", icon: StickyNote },
  { key: "chat", label: "팀 채팅", icon: MessagesSquare },
]

const STATUS_META: Record<TaskStatus, { label: string; cls: string }> = {
  open: { label: "열림", cls: "border-border text-muted-foreground" },
  doing: { label: "진행", cls: "border-primary/30 bg-primary/5 text-primary" },
  done: { label: "완료", cls: "border-success/30 bg-success/5 text-success" },
}

function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (text: string) => void }) {
  const [text, setText] = useState("")
  const submit = () => {
    if (!text.trim()) return
    onAdd(text)
    setText("")
  }
  return (
    <div className="flex gap-2">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={placeholder}
      />
      <Button size="icon" onClick={submit} aria-label="추가">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}

function TasksView() {
  const { tasks, addTask, cycleStatus, removeTask } = useCollab()
  const count = (s: TaskStatus) => tasks.filter((t) => t.status === s).length

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">할 일</h2>
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>열림 {count("open")}</span>
          <span>· 진행 {count("doing")}</span>
          <span>· 완료 {count("done")}</span>
        </div>
      </div>

      <AddRow placeholder="할 일 추가…" onAdd={addTask} />

      <ul className="mt-4 space-y-1">
        {tasks.length === 0 && (
          <li className="py-8 text-center text-sm text-muted-foreground">아직 없어요</li>
        )}
        {tasks.map((t) => {
          const meta = STATUS_META[t.status] ?? STATUS_META.open
          return (
            <li
              key={t.id}
              className="group flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-accent/40"
            >
              <button
                onClick={() => cycleStatus(t.id)}
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-smooth",
                  meta.cls,
                )}
                title="클릭하면 상태 전환 (열림 → 진행 → 완료)"
              >
                {meta.label}
              </button>
              <span
                className={cn(
                  "min-w-0 flex-1 break-words text-sm",
                  t.status === "done" ? "text-muted-foreground line-through" : "text-foreground",
                )}
              >
                {t.text}
              </span>
              <span className="hidden shrink-0 font-mono text-[11px] text-muted-foreground sm:inline">
                {t.author.split("@")[0]}
              </span>
              <button
                onClick={() => removeTask(t.id)}
                className="shrink-0 text-muted-foreground opacity-0 transition-smooth hover:text-destructive group-hover:opacity-100"
                aria-label="삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function NotesView() {
  const { notes, addNote, removeNote } = useCollab()
  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold">메모</h2>
      <AddRow placeholder="메모 추가…" onAdd={addNote} />
      <ul className="mt-4 space-y-2">
        {notes.length === 0 && (
          <li className="py-8 text-center text-sm text-muted-foreground">아직 없어요</li>
        )}
        {notes.map((n) => (
          <li
            key={n.id}
            className="group flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2"
          >
            <span className="flex-1 whitespace-pre-wrap break-words text-sm">{n.text}</span>
            <span className="mt-0.5 hidden shrink-0 font-mono text-[11px] text-muted-foreground sm:inline">
              {n.author.split("@")[0]}
            </span>
            <button
              onClick={() => removeNote(n.id)}
              className="mt-0.5 shrink-0 text-muted-foreground opacity-0 transition-smooth hover:text-destructive group-hover:opacity-100"
              aria-label="삭제"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ChatView() {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">팀 채팅</h2>
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3" /> 백엔드 연동 시
        </span>
      </div>
      <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
        <MessagesSquare className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          실시간 채팅은 팀이 함께 보는 공유 저장소가 필요해서, 백엔드가 뜨면 열립니다. 저장 계층(<span className="font-mono">store.ts</span>)만
          API 로 바꾸면 할 일·메모와 함께 팀 공유로 승격돼요. 그전까지 급한 소통은 디스코드로.
        </p>
      </div>
    </div>
  )
}

function CollabShell() {
  const [view, setView] = useState<ViewKey>("tasks")
  const { ready } = useCollab()

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Users className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">협업</h1>
          <p className="text-xs text-muted-foreground">내부 팀 전용 워크스페이스</p>
        </div>
      </div>

      <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          지금은 <span className="font-medium text-foreground">내 브라우저에만 저장</span>돼요(localStorage). 백엔드가
          뜨면 저장 계층만 API 로 바꿔 <span className="font-medium text-foreground">팀 공유</span>로 승격됩니다 — 화면은 그대로.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
        {/* 사이드바 */}
        <aside className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-smooth",
                view === v.key
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <v.icon className="h-4 w-4" />
              {v.label}
            </button>
          ))}
        </aside>

        {/* 본문 */}
        <div className="rounded-xl border border-border bg-card p-5">
          {!ready ? (
            <div className="py-12 text-center text-sm text-muted-foreground">불러오는 중…</div>
          ) : view === "tasks" ? (
            <TasksView />
          ) : view === "notes" ? (
            <NotesView />
          ) : (
            <ChatView />
          )}
        </div>
      </div>
    </div>
  )
}

export default function Collab() {
  const { state } = useAuth()

  // 내부(개발자 로그인) 세션만 접근. 일반 세션이 URL 로 들어오면 앱으로 돌려보낸다.
  const devSession =
    typeof window !== "undefined" && window.localStorage.getItem("ids_dev_session") === "1"
  if (!devSession) return <Navigate to="/predict" replace />

  return (
    <CollabProvider author={state.email ?? "나"}>
      <CollabShell />
    </CollabProvider>
  )
}
