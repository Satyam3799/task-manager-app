import React, { createContext, useContext, useMemo, useState } from "react";

type User = { id: string; email: string; name?: string | null };
type AuthState = { token: string | null; user: User | null };

type AuthContextValue = AuthState & {
  setSession: (session: { token: string; user: User }) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const LS_TOKEN = "tm_token";
const LS_USER = "tm_user";

export function AuthProvider(props: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(LS_TOKEN));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(LS_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      setSession: (session) => {
        setToken(session.token);
        setUser(session.user);
        localStorage.setItem(LS_TOKEN, session.token);
        localStorage.setItem(LS_USER, JSON.stringify(session.user));
      },
      logout: () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(LS_TOKEN);
        localStorage.removeItem(LS_USER);
      },
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}

