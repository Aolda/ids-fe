import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Navigation } from "@/components/navigation";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Predict from "./pages/Predict";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Settings from "./pages/Settings";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAuth();
  return state.token ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAuth();
  return state.token ? <Navigate to="/predict" replace /> : <>{children}</>;
};

// 랜딩/로그인/회원가입은 자체 헤더를 쓰므로 공용 상단 네비게이션을 숨긴다.
const CHROMELESS_ROUTES = new Set(["/", "/login", "/signup"]);
const GlobalNav = () => {
  const { pathname } = useLocation();
  if (CHROMELESS_ROUTES.has(pathname)) return null;
  return <Navigation />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-background">
              <GlobalNav />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <PublicRoute>
                      <Signup />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/predict"
                  element={
                    <PrivateRoute>
                      <Predict />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/projects"
                  element={
                    <PrivateRoute>
                      <Projects />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/projects/:projectId"
                  element={
                    <PrivateRoute>
                      <ProjectDetail />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <PrivateRoute>
                      <Settings />
                    </PrivateRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/predict" replace />} />
              </Routes>
            </div>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;