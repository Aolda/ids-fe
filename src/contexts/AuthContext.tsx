// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from "react";
import { SSO_ENABLED } from "@/lib/config";

interface AuthState {
  token: string | null;
  email: string | null;
  // localStorage 하이드레이션 완료 여부 — 라우트 가드가 첫 페인트(null)로 잘못 리다이렉트하는 걸 막는다.
  initialized: boolean;
}

interface AuthContextType {
  state: AuthState;
  login: (token: string, email: string) => void;
  logout: () => void;
  loginWithTestAccount: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    token: null,
    email: null,
    initialized: false,
  });

  useEffect(() => {
    // SSO 잠금 중엔 이전에 남은 데모 토큰을 신뢰하지 않는다(스테일 토큰으로 실앱 우회 방지).
    // 단, 명시적 개발자 세션(ids_dev_session)은 예외로 유지한다 — 내부 테스트용(/dev-login).
    if (!SSO_ENABLED && localStorage.getItem("ids_dev_session") !== "1") {
      localStorage.removeItem("token");
      localStorage.removeItem("email");
      setState({ token: null, email: null, initialized: true });
      return;
    }
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    setState({ token: token ?? null, email: email ?? null, initialized: true });
  }, []);

  const login = (token: string, email: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("email", email);
    setState({ token, email, initialized: true });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("ids_dev_session");
    setState({ token: null, email: null, initialized: true });
  };

  // 테스트 계정으로 로그인 (개발/테스트용)
  const loginWithTestAccount = () => {
    const testToken = "test_token_" + Date.now();
    const testEmail = "demo@ajou.ac.kr";
    login(testToken, testEmail);
  };

  return (
    <AuthContext.Provider value={{ state, login, logout, loginWithTestAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
