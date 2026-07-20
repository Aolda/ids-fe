// 내부 협업 데이터 저장소 (single source of I/O)
//
// 지금은 브라우저 localStorage 에만 저장한다(= 개인용). 백엔드가 뜨면 아래 CollabStore 를
// 구현하는 httpCollabStore(fetch) 로 `collabStore` 만 바꾸면 데이터가 팀 공유로 바뀐다.
// 모든 메서드는 지금도 async 라(로컬은 즉시 resolve) 호출부(CollabContext)는 그대로 쓴다.
//
// ⚠ 완전한 "한 줄 교체"는 아니다: HTTP 는 실패할 수 있으므로, 승격 시 CollabContext 의
//   각 뮤테이션에 실패 롤백·pending 표시·에러 토스트·(원하면)재조회 폴링을 함께 붙여야 한다.
//   localStorage 는 실패하지 않아 지금은 그게 생략돼 있을 뿐이다. ← 유지보수 지점.

export type TaskStatus = "open" | "doing" | "done"

export interface Task {
  id: string
  text: string
  status: TaskStatus
  author: string
  createdAt: number
}

export interface Note {
  id: string
  text: string
  author: string
  createdAt: number
}

export interface CollabStore {
  listTasks(): Promise<Task[]>
  createTask(text: string, author: string): Promise<Task>
  setTaskStatus(id: string, status: TaskStatus): Promise<void>
  deleteTask(id: string): Promise<void>
  listNotes(): Promise<Note[]>
  createNote(text: string, author: string): Promise<Note>
  deleteNote(id: string): Promise<void>
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

function load<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    // 배열이 아닌 값(손상/변조된 저장소, 혹은 나중에 HTTP 로 바꿨을 때의 예상 밖 응답)은
    // 화면이 .filter/.map 에서 터지지 않도록 빈 배열로 눌러버린다.
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function save<T>(key: string, value: T[]): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 저장 실패는 무시 — 세션 내 상태는 유지된다 */
  }
}

const TASKS_KEY = "ids_collab_tasks"
const NOTES_KEY = "ids_collab_notes"

// ── 현재 구현: localStorage (개인, 이 브라우저에만) ──────────────────────────
const localCollabStore: CollabStore = {
  async listTasks() {
    return load<Task>(TASKS_KEY)
  },
  async createTask(text, author) {
    const task: Task = { id: uid(), text, status: "open", author, createdAt: Date.now() }
    save(TASKS_KEY, [task, ...load<Task>(TASKS_KEY)])
    return task
  },
  async setTaskStatus(id, status) {
    save(
      TASKS_KEY,
      load<Task>(TASKS_KEY).map((t) => (t.id === id ? { ...t, status } : t)),
    )
  },
  async deleteTask(id) {
    save(
      TASKS_KEY,
      load<Task>(TASKS_KEY).filter((t) => t.id !== id),
    )
  },
  async listNotes() {
    return load<Note>(NOTES_KEY)
  },
  async createNote(text, author) {
    const note: Note = { id: uid(), text, author, createdAt: Date.now() }
    save(NOTES_KEY, [note, ...load<Note>(NOTES_KEY)])
    return note
  },
  async deleteNote(id) {
    save(
      NOTES_KEY,
      load<Note>(NOTES_KEY).filter((n) => n.id !== id),
    )
  },
}

// ── 팀 공유 배선(미완, 백엔드 대기) ──────────────────────────────────────────
// 백엔드가 뜨면 이 스켈레톤을 채우고 `activeStore = httpCollabStore(...)` 로 바꾸면
// 화면 수정 없이 팀 공유가 된다. vibely 도 실시간이 아니라 REST + 짧은 폴링이었으니,
// 여기서도 fetch + (원하면) setInterval 재조회면 충분하다. Yjs/웹소켓 불필요.
//
// export function httpCollabStore(apiBase: string, authFetch: typeof fetch): CollabStore {
//   const j = (r: Response) => r.json()
//   return {
//     listTasks: () => authFetch(`${apiBase}/api/v1/collab/tasks`).then(j),
//     createTask: (text, author) =>
//       authFetch(`${apiBase}/api/v1/collab/tasks`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ text, author }),
//       }).then(j),
//     // ... setTaskStatus / deleteTask / notes 동일 패턴
//   }
// }

// 현재 활성 저장소. 백엔드 승격 시 여기 한 줄만 바꾼다.
export const collabStore: CollabStore = localCollabStore
