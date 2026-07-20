import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { collabStore, Note, Task, TaskStatus } from "./store"

interface CollabContextValue {
  tasks: Task[]
  notes: Note[]
  ready: boolean
  addTask: (text: string) => void
  cycleStatus: (id: string) => void
  removeTask: (id: string) => void
  addNote: (text: string) => void
  removeNote: (id: string) => void
}

const CollabContext = createContext<CollabContextValue | null>(null)

export const useCollab = () => {
  const ctx = useContext(CollabContext)
  if (!ctx) throw new Error("useCollab must be used within CollabProvider")
  return ctx
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  open: "doing",
  doing: "done",
  done: "open",
}

// 화면은 이 컨텍스트만 본다. 실제 저장은 store 가 담당(지금 localStorage → 나중에 API).
// 삭제·상태변경은 로컬을 먼저 갱신(낙관적)하고 store 에 반영, 추가는 store 가 만든 레코드를 넣는다.
// ⚠ HTTP store 로 승격 시: 각 뮤테이션에 실패 롤백·pending 표시·에러 토스트를 여기서 붙여야 한다
//   (localStorage 는 실패하지 않아 지금은 생략). 재조회 폴링도 그때 이 컨텍스트에 건다.
export function CollabProvider({
  author,
  children,
}: {
  author: string
  children: React.ReactNode
}) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.all([collabStore.listTasks(), collabStore.listNotes()]).then(([t, n]) => {
      if (!alive) return
      setTasks(t)
      setNotes(n)
      setReady(true)
    })
    return () => {
      alive = false
    }
  }, [])

  const addTask = useCallback(
    (text: string) => {
      const t = text.trim()
      if (!t) return
      collabStore.createTask(t, author).then((task) => setTasks((prev) => [task, ...prev]))
    },
    [author],
  )

  // store 쓰기는 setState 업데이터 밖에서 딱 한 번(순수한 업데이터 유지 → StrictMode·HTTP store 안전).
  const cycleStatus = useCallback(
    (id: string) => {
      const target = tasks.find((x) => x.id === id)
      if (!target) return
      const next = NEXT_STATUS[target.status]
      setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, status: next } : x)))
      collabStore.setTaskStatus(id, next)
    },
    [tasks],
  )

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((x) => x.id !== id))
    collabStore.deleteTask(id)
  }, [])

  const addNote = useCallback(
    (text: string) => {
      const t = text.trim()
      if (!t) return
      collabStore.createNote(t, author).then((note) => setNotes((prev) => [note, ...prev]))
    },
    [author],
  )

  const removeNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((x) => x.id !== id))
    collabStore.deleteNote(id)
  }, [])

  return (
    <CollabContext.Provider
      value={{ tasks, notes, ready, addTask, cycleStatus, removeTask, addNote, removeNote }}
    >
      {children}
    </CollabContext.Provider>
  )
}
