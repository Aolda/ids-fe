import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate, NavLink } from "react-router-dom"
import { LogOut, Menu, Users } from "lucide-react"

const navItems = [
  { to: "/predict", label: "대시보드" },
  { to: "/projects", label: "프로젝트" },
  { to: "/settings", label: "설정" },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-smooth ${
    isActive
      ? "bg-accent text-foreground"
      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
  }`

export function Navigation() {
  const { state, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  // 인증되지 않은 사용자에게는 네비게이션을 표시하지 않음
  if (!state.token) {
    return null
  }

  // 개발자 로그인(/dev-login)으로 들어온 내부 세션에만 협업(/collab) 진입점을 노출한다.
  const devSession =
    typeof window !== "undefined" && window.localStorage.getItem("ids_dev_session") === "1"

  const localPart = state.email ? state.email.split("@")[0] : "내 계정"
  const initials = localPart
    .split(".")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            {/* 모바일 햄버거 — md 미만에서 nav 링크 대체 (없으면 프로젝트/설정 도달 불가) */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="메뉴 열기">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="mt-6 flex flex-col gap-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={linkClass}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            <NavLink to="/predict" className="flex items-center gap-2.5">
              <Logo />
              <span className="text-lg font-semibold tracking-tight text-foreground">launcha</span>
            </NavLink>

            {/* Navigation Links (데스크톱) */}
            <div className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1.5">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label="계정 메뉴">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{localPart}</p>
                    <p className="text-xs leading-none text-muted-foreground">{state.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {devSession && (
                  <DropdownMenuItem onClick={() => navigate("/collab")}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>협업</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>로그아웃</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
