import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ListTodo,
  StickyNote,
  MessagesSquare,
  Plus,
  Trash2,
  Circle,
  CheckCircle2,
  Info,
  Lock,
} from "lucide-react"

type Todo = { id: string; text: string; done: boolean }
type Note = { id: string; text: string }

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

// 지금은 브라우저(localStorage)에만 저장한다. 백엔드가 뜨면 이 훅의 저장/로드만 API 로 바꾸면
// 팀 공유로 승격된다(그 외 UI 는 그대로). — 승격 지점.
function useLocalList<T>(key: string): [T[], (updater: (prev: T[]) => T[]) => void] {
  const [list, setList] = useState<T[]>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T[]) : []
    } catch {
      return []
    }
  })
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(list))
    } catch {
      /* 저장 실패는 무시 — 세션 내 상태는 유지된다 */
    }
  }, [key, list])
  const update = (updater: (prev: T[]) => T[]) => setList((prev) => updater(prev))
  return [list, update]
}

function Section({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: React.ElementType
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {desc && <p className="mt-1 text-xs text-muted-foreground">{desc}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

export default function Collab() {
  const [todos, setTodos] = useLocalList<Todo>("ids_collab_todos")
  const [notes, setNotes] = useLocalList<Note>("ids_collab_notes")
  const [todoText, setTodoText] = useState("")
  const [noteText, setNoteText] = useState("")

  // 내부(개발자 로그인) 세션만 접근. 일반 세션이 URL 로 들어오면 앱으로 돌려보낸다.
  const devSession =
    typeof window !== "undefined" && window.localStorage.getItem("ids_dev_session") === "1"
  if (!devSession) return <Navigate to="/predict" replace />

  const addTodo = () => {
    const t = todoText.trim()
    if (!t) return
    setTodos((prev) => [{ id: uid(), text: t, done: false }, ...prev])
    setTodoText("")
  }
  const toggleTodo = (id: string) =>
    setTodos((prev) => prev.map((x) => (x.id === id ? { ...x, done: !x.done } : x)))
  const removeTodo = (id: string) => setTodos((prev) => prev.filter((x) => x.id !== id))

  const addNote = () => {
    const t = noteText.trim()
    if (!t) return
    setNotes((prev) => [{ id: uid(), text: t }, ...prev])
    setNoteText("")
  }
  const removeNote = (id: string) => setNotes((prev) => prev.filter((x) => x.id !== id))

  const openCount = todos.filter((t) => !t.done).length

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <MessagesSquare className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">협업</h1>
          <p className="text-xs text-muted-foreground">내부 팀 전용 · 할 일과 메모</p>
        </div>
      </div>

      {/* 정직한 저장 안내 */}
      <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          지금은 <span className="font-medium text-foreground">내 브라우저에만 저장</span>돼요(localStorage). 백엔드가
          뜨면 저장 계층만 API 로 바꿔 <span className="font-medium text-foreground">팀 공유</span>로 승격됩니다.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 할 일 */}
        <Section
          icon={ListTodo}
          title="할 일"
          desc={todos.length ? `${openCount}개 남음 · 전체 ${todos.length}개` : "처리할 일을 적어두세요"}
        >
          <div className="flex gap-2">
            <Input
              value={todoText}
              onChange={(e) => setTodoText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              placeholder="할 일 추가…"
            />
            <Button size="icon" onClick={addTodo} aria-label="할 일 추가">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <ul className="mt-4 space-y-1">
            {todos.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">아직 없어요</li>
            )}
            {todos.map((t) => (
              <li
                key={t.id}
                className="group flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-accent/40"
              >
                <button
                  onClick={() => toggleTodo(t.id)}
                  className="shrink-0 text-muted-foreground hover:text-primary"
                  aria-label={t.done ? "완료 취소" : "완료"}
                >
                  {t.done ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </button>
                <span
                  className={`flex-1 text-sm ${
                    t.done ? "text-muted-foreground line-through" : "text-foreground"
                  }`}
                >
                  {t.text}
                </span>
                <button
                  onClick={() => removeTodo(t.id)}
                  className="shrink-0 text-muted-foreground opacity-0 transition-smooth hover:text-destructive group-hover:opacity-100"
                  aria-label="삭제"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </Section>

        {/* 메모 */}
        <Section icon={StickyNote} title="메모" desc="짧은 공지·기록을 남겨두세요">
          <div className="flex gap-2">
            <Input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNote()}
              placeholder="메모 추가…"
            />
            <Button size="icon" onClick={addNote} aria-label="메모 추가">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <ul className="mt-4 space-y-2">
            {notes.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">아직 없어요</li>
            )}
            {notes.map((n) => (
              <li
                key={n.id}
                className="group flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2"
              >
                <span className="flex-1 whitespace-pre-wrap break-words text-sm">{n.text}</span>
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
        </Section>
      </div>

      {/* 채팅 — 공유 저장소(백엔드)가 있어야 의미가 있어 자리만 잡아둔다 */}
      <section className="mt-4 rounded-xl border border-dashed border-border bg-card/50 p-5">
        <div className="flex items-center gap-2">
          <MessagesSquare className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground">팀 채팅</h2>
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <Lock className="h-3 w-3" /> 백엔드 연동 시
          </Badge>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          실시간 채팅은 팀이 함께 보는 공유 저장소가 필요해서, 백엔드가 뜨면 열립니다. 그전까지 급한 소통은 디스코드로,
          기록은 위 메모로.
        </p>
      </section>
    </div>
  )
}
