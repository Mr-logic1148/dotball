"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { api, ApiError } from "../lib/api";
import type { User } from "../lib/types";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  changeTeam: (teamId: string) => Promise<User>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  dob: string;
  favorite_team_id: string;
}

const Ctx = createContext<AuthCtx | null>(null);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await api<User>("/api/auth/me");
      setUser(me);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const u = await api<User>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const u = await api<User>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const changeTeam = useCallback(async (teamId: string) => {
    const u = await api<User>("/api/auth/change-team", {
      method: "POST",
      body: JSON.stringify({ favorite_team_id: teamId }),
    });
    setUser(u);
    return u;
  }, []);

  return (
    <Ctx.Provider
      value={{ user, loading, refresh, login, register, logout, changeTeam }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
