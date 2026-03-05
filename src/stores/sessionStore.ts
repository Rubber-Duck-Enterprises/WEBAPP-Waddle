import { create } from "zustand";
import type { User } from "firebase/auth";

type Scope = "anon" | string;

type SessionState = {
  scope: Scope;
  user: User | null;
  loading: boolean;
  isPro: boolean;

  setAnon: () => void;
  setUser: (user: User, isPro?: boolean) => void;
  setLoading: (v: boolean) => void;
  setPro: (v: boolean) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  scope: "anon",
  user: null,
  loading: true,
  isPro: false,

  setAnon: () => set({ scope: "anon", user: null, isPro: false }),
  setUser: (user, isPro = false) => set({ scope: user.uid, user, isPro }),
  setLoading: (v) => set({ loading: v }),
  setPro: (v) => set({ isPro: v }),
}));