import { create } from "zustand";
import type { User } from "firebase/auth";

type Scope = "anon" | string;

type SessionState = {
  scope: Scope;
  user: User | null;
  loading: boolean;
  isPro: boolean;
  lastCloudBackupAt: string | null;

  setAnon: () => void;
  setUser: (user: User, isPro?: boolean) => void;
  setLoading: (v: boolean) => void;
  setPro: (v: boolean) => void;
  setLastCloudBackupAt: (date: string) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  scope: "anon",
  user: null,
  loading: true,
  isPro: false,
  lastCloudBackupAt: null,

  setAnon: () => set({ scope: "anon", user: null, isPro: false }),
  setUser: (user, isPro = false) => set({ scope: user.uid, user, isPro }),
  setLoading: (v) => set({ loading: v }),
  setPro: (v) => set({ isPro: v }),
  setLastCloudBackupAt: (date) => set({ lastCloudBackupAt: date }),
}));