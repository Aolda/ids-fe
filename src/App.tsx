import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Navigation } from "@/components/navigation";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import DevLogin from "./pages/DevLogin";
import DemoLayout from "./demo/DemoLayout";
import DemoOverview from "./pages/demo/Overview";
import DemoServices from "./pages/demo/Services";
import DemoServiceDetail from "./pages/demo/ServiceDetail";
import DemoCluster from "./pages/demo/Cluster";
import DemoActivity from "./pages/demo/Activity";
import DemoGuide from "./pages/demo/Guide";
import DemoSettings from "./pages/demo/Settings";
import Predict from "./pages/Predict";
import Projects from "./pages/Projects";
import Settings from "./pages/Settings";
import Collab from "./pages/Collab";
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
  if (!state.initialized) return null; // 하이드레이션 전 리다이렉트 방지
  return state.token ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAuth();
  if (!state.initialized) return null;
  return state.token ? <Navigate to="/predict" replace /> : <>{children}</>;
};

// 랜딩/로그인은 자체 헤더를 쓰므로 공용 상단 네비게이션을 숨긴다.
// 랜딩/로그인/데모는 자체 헤더를 쓰므로 공용 상단 네비게이션을 숨긴다.
const CHROMELESS_ROUTES = new Set(["/", "/login", "/dev-login"]);
const GlobalNav = () => {
  const { pathname } = useLocation();
  if (CHROMELESS_ROUTES.has(pathname) || pathname.startsWith("/demo")) return null;
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
                <Route path="/demo" element={<DemoLayout />}>
                  <Route index element={<DemoOverview />} />
                  <Route path="services" element={<DemoServices />} />
                  <Route path="services/:id" element={<DemoServiceDetail />} />
                  <Route path="cluster" element={<DemoCluster />} />
                  <Route path="activity" element={<DemoActivity />} />
                  <Route path="guide" element={<DemoGuide />} />
                  <Route path="settings" element={<DemoSettings />} />
                </Route>
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/dev-login"
                  element={
                    <PublicRoute>
                      <DevLogin />
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
                  path="/settings"
                  element={
                    <PrivateRoute>
                      <Settings />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/collab"
                  element={
                    <PrivateRoute>
                      <Collab />
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