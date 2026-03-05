import React, { createContext, useContext, useEffect, useMemo } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, initAuthPersistence, signInWithGoogle, signOutOnly } from "@/lib/firebase";

import { useSessionStore } from "@/stores/sessionStore";
import { setScopeGetter } from "@/lib/userScope";
import { resetUserStoresToEmpty, rehydrateAllStores } from "@/lib/resetUserStores";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  scope: string;
  isPro: boolean;

  loginGoogle: () => Promise<User | null>;
  logoutToAnon: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user, loading, scope, isPro, setAnon, setUser, setLoading } = useSessionStore();

  useEffect(() => {
    setScopeGetter(() => useSessionStore.getState().scope);
  }, []);

  useEffect(() => {
    (async () => {
      await initAuthPersistence();

      const unsub = onAuthStateChanged(auth, async (u) => {
        setLoading(true);

        if (u) {
          setUser(u, false);
        } else {
          setAnon();
        }

        resetUserStoresToEmpty();
        await rehydrateAllStores();

        setLoading(false);
      });

      return () => unsub();
    })();
  }, [setAnon, setUser, setLoading]);

  const api = useMemo<AuthCtx>(
    () => ({
      user,
      loading,
      scope,
      isPro,

      loginGoogle: async () => {
        const u = await signInWithGoogle();
        return u;
      },

      logoutToAnon: async () => {
        await signOutOnly();
      },
    }),
    [user, loading, scope, isPro]
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
};

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}