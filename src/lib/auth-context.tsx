import { useRouter } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";
import { ensureAccount, type AccountInfo } from "@/lib/auth.functions";
import { useGym } from "@/lib/gym-store";

type AuthContextValue = {
  loading: boolean;
  user: User | null;
  account: AccountInfo | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { signIn, signOut: clearGymSession } = useGym();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<AccountInfo | null>(null);

  const load = useCallback(
    async (nextUser: User | null) => {
      setUser(nextUser);
      if (!nextUser) {
        setAccount(null);
        clearGymSession();
        setLoading(false);
        return;
      }
      try {
        const info = await ensureAccount();
        setAccount(info);
        signIn(info.role, info.fullName);
      } catch {
        setAccount(null);
      } finally {
        setLoading(false);
      }
    },
    [clearGymSession, signIn],
  );

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) void load(data.session?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      void load(session?.user ?? null);
      router.invalidate();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccount(null);
    clearGymSession();
  }, [clearGymSession]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await load(data.session?.user ?? null);
  }, [load]);

  const value = useMemo<AuthContextValue>(
    () => ({ loading, user, account, signOut, refresh }),
    [loading, user, account, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
