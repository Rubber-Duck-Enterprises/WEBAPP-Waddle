import { describe, it, expect, vi } from "vitest";

/**
 * Unit tests verifying dead code removal (Requirements 1.1, 1.3)
 *
 * These tests confirm that:
 * - `ProRoute` has been removed from src/routes/guards.tsx (Req 1.1)
 * - `saveBackupToCloud` has been removed from src/lib/firebase.ts (Req 1.3)
 */

// ─── Mocks for guards.tsx dependencies ───────────────────────────────────────

vi.mock("react-router-dom", () => ({
  Navigate: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(() => ({ user: null, loading: false })),
}));

vi.mock("react", () => ({
  default: { createElement: vi.fn() },
}));

// ─── Mocks required to import firebase.ts in a node test environment ─────────

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock("firebase/messaging", () => ({
  getMessaging: vi.fn(() => ({})),
  getToken: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signOut: vi.fn(),
  setPersistence: vi.fn(),
  indexedDBLocalPersistence: {},
  browserLocalPersistence: {},
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  sendEmailVerification: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock("@/stores/settingsStore", () => ({
  useSettingsStore: {
    getState: () => ({ dayStartTime: "08:00", dayEndTime: "22:00" }),
  },
}));

// ─── Req 1.1: ProRoute removed from guards.tsx ───────────────────────────────

describe("guards.tsx — dead code removal", () => {
  it("does not export ProRoute", async () => {
    const guards = await import("@/routes/guards");
    expect((guards as Record<string, unknown>).ProRoute).toBeUndefined();
  });

  it("still exports the expected live routes", async () => {
    const guards = await import("@/routes/guards");
    expect(guards.PublicRoute).toBeDefined();
    expect(guards.AnyUserRoute).toBeDefined();
    expect(guards.AuthOnlyRoute).toBeDefined();
  });
});

// ─── Req 1.3: saveBackupToCloud removed from firebase.ts ─────────────────────

describe("firebase.ts — dead code removal", () => {
  it("does not export saveBackupToCloud", async () => {
    const firebase = await import("@/lib/firebase");
    expect((firebase as Record<string, unknown>).saveBackupToCloud).toBeUndefined();
  });

  it("still exports the expected live functions", async () => {
    const firebase = await import("@/lib/firebase");
    expect(firebase.signInWithGoogle).toBeDefined();
    expect(firebase.signOutOnly).toBeDefined();
    expect(firebase.requestPermissionAndToken).toBeDefined();
  });
});
