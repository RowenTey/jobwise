import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { login as apiLogin, signup as apiSignup, logout as apiLogout } from "@/lib/api";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("accessToken"));
  const isLoading = false;

  const login = useCallback(async (username: string, password: string) => {
    await apiLogin(username, password);
    setIsAuthenticated(true);
  }, []);

  const signupFn = useCallback(async (username: string, email: string, password: string) => {
    await apiSignup(username, email, password);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    setIsAuthenticated(false);
    try {
      await apiLogout();
    } catch {
      // Local state already cleared
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, signup: signupFn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
