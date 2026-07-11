// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthState {
  token: string | null;
  email: string | null;
}

interface AuthContextType {
  state: AuthState;
  login: (token: string, email: string) => void;
  logout: () => void;
  loginWithTestAccount: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({ token: null, email: null });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    if (token && email) {
      setState({ token, email });
    }
  }, []);

  const login = (token: string, email: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("email", email);
    setState({ token, email });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    setState({ token: null, email: null });
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
