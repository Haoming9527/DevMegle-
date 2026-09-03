"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";

export type DevmegleUser = {
  id: string;
  email?: string;
};

interface AuthContextType {
  user: DevmegleUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const LOCAL_USER_KEY = "devmegle:user";

function localUserFromEmail(email: string): DevmegleUser {
  const safeEmail = email.trim().toLowerCase();
  return {
    id: `local_${btoa(safeEmail).replace(/=+$/g, "").slice(0, 24)}`,
    email: safeEmail,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DevmegleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      if (supabase) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!cancelled) {
          setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
          setLoading(false);
        }
        return;
      }

      const saved = window.localStorage.getItem(LOCAL_USER_KEY);
      if (!cancelled) {
        setUser(saved ? (JSON.parse(saved) as DevmegleUser) : null);
        setLoading(false);
      }
    }

    loadUser().catch(() => setLoading(false));

    if (!supabase) {
      return () => {
        cancelled = true;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      signIn: async (email: string, password: string) => {
        if (supabase) {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        } else {
          const localUser = localUserFromEmail(email);
          window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
          setUser(localUser);
        }
        router.push("/dashboard");
      },
      signUp: async (email: string, password: string) => {
        if (supabase) {
          const { error } = await supabase.auth.signUp({ email, password });
          if (error) throw error;
        } else {
          const localUser = localUserFromEmail(email);
          window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
          setUser(localUser);
        }
      },
      signOut: async () => {
        if (supabase) {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
        }
        window.localStorage.removeItem(LOCAL_USER_KEY);
        setUser(null);
        router.push("/");
      },
    }),
    [loading, router, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
