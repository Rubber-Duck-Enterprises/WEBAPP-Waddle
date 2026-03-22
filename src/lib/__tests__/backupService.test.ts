import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getBackupFilename, exportBackupToFile, importBackupFromFile, loadCloudBackup, shouldTriggerAutoBackup, saveAutoBackup, saveCloudBackup, restoreFromSnapshot } from "../backupService";
import type { BackupSnapshot } from "../backupTypes";

// ─── Firebase mocks ───────────────────────────────────────────────────────────

vi.mock("@/lib/firebase", () => ({
  auth: { currentUser: null },
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock("@/stores/walletStore", () => ({
  useWalletStore: {
    getState: () => ({ sections: [], expenses: [], hasFirstWallet: false }),
  },
}));

vi.mock("@/stores/listStore", () => ({
  useListStore: {
    getState: () => ({ taskLists: [], tasks: [], tagsByList: {}, activeListId: "" }),
  },
}));

vi.mock("localforage", () => ({
  default: {
    setItem: vi.fn().mockResolvedValue(undefined),
    getItem: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock("../resetUserStores", () => ({
  rehydrateAllStores: vi.fn().mockResolvedValue(undefined),
}));

// ─── getBackupFilename ────────────────────────────────────────────────────────

describe("getBackupFilename", () => {
  it("generates filename with correct format for a known date", () => {
    const date = new Date(2024, 0, 15); // Jan 15, 2024 (local)
    expect(getBackupFilename(date)).toBe("waddle-backup-2024-01-15.json");
  });

  it("pads month and day with leading zeros", () => {
    const date = new Date(2024, 2, 5); // Mar 5, 2024 (local)
    expect(getBackupFilename(date)).toBe("waddle-backup-2024-03-05.json");
  });

  it("uses local date (not UTC)", () => {
    const date = new Date(2024, 11, 31); // Dec 31, 2024 local
    expect(getBackupFilename(date)).toBe("waddle-backup-2024-12-31.json");
  });

  it("defaults to today when no date is provided", () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    expect(getBackupFilename()).toBe(`waddle-backup-${year}-${month}-${day}.json`);
  });
});

// ─── exportBackupToFile ───────────────────────────────────────────────────────

describe("exportBackupToFile", () => {
  const mockSnapshot: BackupSnapshot = {
    version: 1,
    createdAt: "2024-01-15T10:00:00.000Z",
    appVersion: "1.0.0",
    origin: "manual",
    scope: "full",
    data: {
      wallet: { sections: [], expenses: [], hasFirstWallet: false },
      list: { taskLists: [], tasks: [], tagsByList: {}, activeListId: "" },
    },
  };

  let mockAnchor: { href: string; download: string; click: ReturnType<typeof vi.fn> };
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let originalDocument: typeof globalThis.document;
  let originalURL: typeof globalThis.URL;

  beforeEach(() => {
    mockAnchor = { href: "", download: "", click: vi.fn() };
    createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    revokeObjectURL = vi.fn();

    // Save originals
    originalDocument = globalThis.document;
    originalURL = globalThis.URL;

    // Stub document.createElement
    globalThis.document = {
      createElement: vi.fn().mockReturnValue(mockAnchor),
    } as unknown as typeof globalThis.document;

    // Stub URL
    globalThis.URL = {
      createObjectURL,
      revokeObjectURL,
    } as unknown as typeof globalThis.URL;
  });

  afterEach(() => {
    globalThis.document = originalDocument;
    globalThis.URL = originalURL;
  });

  it("sets the download attribute to the provided filename", () => {
    exportBackupToFile(mockSnapshot, "waddle-backup-2024-01-15.json");
    expect(mockAnchor.download).toBe("waddle-backup-2024-01-15.json");
  });

  it("sets href to the object URL", () => {
    exportBackupToFile(mockSnapshot, "test.json");
    expect(mockAnchor.href).toBe("blob:mock-url");
  });

  it("clicks the anchor to trigger download", () => {
    exportBackupToFile(mockSnapshot, "test.json");
    expect(mockAnchor.click).toHaveBeenCalledOnce();
  });

  it("revokes the object URL after clicking", () => {
    exportBackupToFile(mockSnapshot, "test.json");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("creates a Blob with JSON content of the snapshot", () => {
    const blobSpy = vi.spyOn(globalThis, "Blob");
    exportBackupToFile(mockSnapshot, "test.json");
    expect(blobSpy).toHaveBeenCalledWith(
      [JSON.stringify(mockSnapshot, null, 2)],
      { type: "application/json" }
    );
  });
});

// ─── importBackupFromFile ─────────────────────────────────────────────────────

describe("importBackupFromFile", () => {
  const validSnapshot = {
    version: 1,
    createdAt: "2024-01-15T10:00:00.000Z",
    appVersion: "1.0.0",
    origin: "manual",
    scope: "full",
    data: {
      wallet: { sections: [], expenses: [], hasFirstWallet: false },
      list: { taskLists: [], tasks: [], tagsByList: {}, activeListId: "" },
    },
  };

  function makeFile(content: string, name = "backup.json"): File {
    return new File([content], name, { type: "application/json" });
  }

  it("returns a valid snapshot from a well-formed file", async () => {
    const file = makeFile(JSON.stringify(validSnapshot));
    const result = await importBackupFromFile(file);
    expect(result.version).toBe(1);
    expect(result.createdAt).toBe(validSnapshot.createdAt);
    expect(result.data).toEqual(validSnapshot.data);
  });

  it("throws a descriptive error for invalid JSON", async () => {
    const file = makeFile("not json at all {{{");
    await expect(importBackupFromFile(file)).rejects.toThrow(
      /JSON válido/
    );
  });

  it("throws a descriptive error when required fields are missing", async () => {
    const file = makeFile(JSON.stringify({ foo: "bar" }));
    await expect(importBackupFromFile(file)).rejects.toThrow(
      /respaldo válido/
    );
  });

  it("throws when version field is missing", async () => {
    const { version: _v, ...noVersion } = validSnapshot;
    const file = makeFile(JSON.stringify(noVersion));
    await expect(importBackupFromFile(file)).rejects.toThrow(/respaldo válido/);
  });

  it("throws when data field is missing", async () => {
    const { data: _d, ...noData } = validSnapshot;
    const file = makeFile(JSON.stringify(noData));
    await expect(importBackupFromFile(file)).rejects.toThrow(/respaldo válido/);
  });

  it("applies migration to a v0 snapshot with legacy keys", async () => {
    const legacySnapshot = {
      version: 0,
      createdAt: "2023-01-01T00:00:00.000Z",
      appVersion: "0.9.0",
      origin: "manual",
      scope: "full",
      data: {},
      // legacy top-level keys
      sections: [{ id: "s1", name: "Food" }],
      expenses: [],
    };
    const file = makeFile(JSON.stringify(legacySnapshot));
    const result = await importBackupFromFile(file);
    expect(result.version).toBe(1);
    expect(result.data.wallet?.sections).toEqual([{ id: "s1", name: "Food" }]);
  });

  it("returns snapshot unchanged when already at current version", async () => {
    const file = makeFile(JSON.stringify(validSnapshot));
    const result = await importBackupFromFile(file);
    expect(result).toEqual(validSnapshot);
  });
});

// ─── loadCloudBackup ──────────────────────────────────────────────────────────

describe("loadCloudBackup", () => {
  const validSnapshot: BackupSnapshot = {
    version: 1,
    createdAt: "2024-06-01T12:00:00.000Z",
    appVersion: "1.0.0",
    origin: "manual",
    scope: "full",
    data: {
      wallet: { sections: [], expenses: [], hasFirstWallet: false },
      list: { taskLists: [], tasks: [], tagsByList: {}, activeListId: "" },
    },
  };

  beforeEach(async () => {
    const { doc } = await import("firebase/firestore");
    vi.mocked(doc).mockReturnValue({} as ReturnType<typeof doc>);
  });

  afterEach(async () => {
    vi.clearAllMocks();
    const { auth } = await import("@/lib/firebase");
    (auth as { currentUser: unknown }).currentUser = null;
  });

  it("throws when user is not authenticated", async () => {
    const { auth } = await import("@/lib/firebase");
    (auth as { currentUser: unknown }).currentUser = null;
    await expect(loadCloudBackup()).rejects.toThrow(/iniciar sesión/);
  });

  it("returns null when the Firestore document does not exist", async () => {
    const { auth } = await import("@/lib/firebase");
    const { getDoc } = await import("firebase/firestore");
    (auth as { currentUser: unknown }).currentUser = { uid: "user-1" };
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => false,
      data: () => undefined,
    } as Awaited<ReturnType<typeof getDoc>>);

    const result = await loadCloudBackup();
    expect(result).toBeNull();
  });

  it("returns null when the document exists but manual field is absent", async () => {
    const { auth } = await import("@/lib/firebase");
    const { getDoc } = await import("firebase/firestore");
    (auth as { currentUser: unknown }).currentUser = { uid: "user-1" };
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ updatedAt: "2024-01-01" }),
    } as Awaited<ReturnType<typeof getDoc>>);

    const result = await loadCloudBackup();
    expect(result).toBeNull();
  });

  it("returns null when the manual field is null", async () => {
    const { auth } = await import("@/lib/firebase");
    const { getDoc } = await import("firebase/firestore");
    (auth as { currentUser: unknown }).currentUser = { uid: "user-1" };
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ manual: null }),
    } as Awaited<ReturnType<typeof getDoc>>);

    const result = await loadCloudBackup();
    expect(result).toBeNull();
  });

  it("returns the snapshot when the manual field is present", async () => {
    const { auth } = await import("@/lib/firebase");
    const { getDoc } = await import("firebase/firestore");
    (auth as { currentUser: unknown }).currentUser = { uid: "user-1" };
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ manual: validSnapshot }),
    } as Awaited<ReturnType<typeof getDoc>>);

    const result = await loadCloudBackup();
    expect(result).toEqual(validSnapshot);
  });

  it("throws a user-friendly message on network error", async () => {
    const { auth } = await import("@/lib/firebase");
    const { getDoc } = await import("firebase/firestore");
    (auth as { currentUser: unknown }).currentUser = { uid: "user-1" };
    vi.mocked(getDoc).mockRejectedValueOnce(new Error("Network request failed"));

    await expect(loadCloudBackup()).rejects.toThrow(/nube para cargar el respaldo/);
  });
});

// ─── shouldTriggerAutoBackup ──────────────────────────────────────────────────

describe("shouldTriggerAutoBackup", () => {
  it("returns true when lastAutoBackupAt is null (never backed up)", () => {
    expect(shouldTriggerAutoBackup(null)).toBe(true);
  });

  it("returns true when last backup was more than 24 hours ago", () => {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    expect(shouldTriggerAutoBackup(twoDaysAgo)).toBe(true);
  });

  it("returns true when last backup was exactly 24h + 1ms ago", () => {
    const justOver24h = new Date(Date.now() - (24 * 60 * 60 * 1000 + 1)).toISOString();
    expect(shouldTriggerAutoBackup(justOver24h)).toBe(true);
  });

  it("returns false when last backup was less than 24 hours ago", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(shouldTriggerAutoBackup(oneHourAgo)).toBe(false);
  });

  it("returns false when last backup was just now", () => {
    const justNow = new Date().toISOString();
    expect(shouldTriggerAutoBackup(justNow)).toBe(false);
  });

  it("returns false when last backup was exactly 23h 59m ago", () => {
    const almostDay = new Date(Date.now() - (23 * 60 * 60 * 1000 + 59 * 60 * 1000)).toISOString();
    expect(shouldTriggerAutoBackup(almostDay)).toBe(false);
  });
});

// ─── saveCloudBackup (Pro history) ───────────────────────────────────────────

describe("saveCloudBackup — Pro manual_history", () => {
  const mockSnapshot = {
    version: 1,
    createdAt: "2024-01-15T10:00:00.000Z",
    appVersion: "1.0.0",
    origin: "manual" as const,
    scope: "full" as const,
    data: {
      wallet: { sections: [], expenses: [], hasFirstWallet: false },
      list: { taskLists: [], tasks: [], tagsByList: {}, activeListId: "" },
    },
  };

  beforeEach(async () => {
    const { doc } = await import("firebase/firestore");
    vi.mocked(doc).mockReturnValue({} as ReturnType<typeof doc>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("writes manual_history when isPro is true", async () => {
    const { auth } = await import("@/lib/firebase");
    const { getDoc, setDoc } = await import("firebase/firestore");
    const { useSessionStore } = await import("@/stores/sessionStore");

    (auth as { currentUser: unknown }).currentUser = { uid: "pro-user", email: "pro@test.com" };
    useSessionStore.setState({ isPro: true });

    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ manual_history: [mockSnapshot] }),
    } as Awaited<ReturnType<typeof getDoc>>);

    vi.mocked(setDoc).mockResolvedValueOnce(undefined);

    await saveCloudBackup();

    expect(setDoc).toHaveBeenCalledOnce();
    const payload = vi.mocked(setDoc).mock.calls[0][1] as Record<string, unknown>;
    expect(payload).toHaveProperty("manual_history");
    const history = payload.manual_history as unknown[];
    expect(history.length).toBeLessThanOrEqual(3);
  });

  it("does NOT write manual_history when isPro is false", async () => {
    const { auth } = await import("@/lib/firebase");
    const { setDoc } = await import("firebase/firestore");
    const { useSessionStore } = await import("@/stores/sessionStore");

    (auth as { currentUser: unknown }).currentUser = { uid: "free-user", email: "free@test.com" };
    useSessionStore.setState({ isPro: false });

    vi.mocked(setDoc).mockResolvedValueOnce(undefined);

    await saveCloudBackup();

    const payload = vi.mocked(setDoc).mock.calls[0][1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("manual_history");
  });

  it("caps manual_history at 3 when Pro user has existing history", async () => {
    const { auth } = await import("@/lib/firebase");
    const { getDoc, setDoc } = await import("firebase/firestore");
    const { useSessionStore } = await import("@/stores/sessionStore");

    (auth as { currentUser: unknown }).currentUser = { uid: "pro-user", email: "pro@test.com" };
    useSessionStore.setState({ isPro: true });

    // Existing history already has 3 items
    const existingHistory = [mockSnapshot, mockSnapshot, mockSnapshot];
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ manual_history: existingHistory }),
    } as Awaited<ReturnType<typeof getDoc>>);

    vi.mocked(setDoc).mockResolvedValueOnce(undefined);

    await saveCloudBackup();

    const payload = vi.mocked(setDoc).mock.calls[0][1] as Record<string, unknown>;
    const history = payload.manual_history as unknown[];
    expect(history.length).toBe(3);
  });
});

// ─── saveAutoBackup ───────────────────────────────────────────────────────────

describe("saveAutoBackup", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when user is not authenticated", async () => {
    const { auth } = await import("@/lib/firebase");
    const { setDoc } = await import("firebase/firestore");
    (auth as { currentUser: unknown }).currentUser = null;

    await saveAutoBackup();

    expect(setDoc).not.toHaveBeenCalled();
  });

  it("does nothing when isPro is false", async () => {
    const { auth } = await import("@/lib/firebase");
    const { setDoc } = await import("firebase/firestore");
    const { useSessionStore } = await import("@/stores/sessionStore");

    (auth as { currentUser: unknown }).currentUser = { uid: "free-user" };
    useSessionStore.setState({ isPro: false });

    await saveAutoBackup();

    expect(setDoc).not.toHaveBeenCalled();
  });

  it("does nothing when last auto backup was less than 24 hours ago", async () => {
    const { auth } = await import("@/lib/firebase");
    const { getDoc, setDoc, doc } = await import("firebase/firestore");
    const { useSessionStore } = await import("@/stores/sessionStore");

    (auth as { currentUser: unknown }).currentUser = { uid: "pro-user" };
    useSessionStore.setState({ isPro: true });
    vi.mocked(doc).mockReturnValue({} as ReturnType<typeof doc>);

    const recentBackup = { createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() };
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ auto_history: [recentBackup] }),
    } as Awaited<ReturnType<typeof getDoc>>);

    await saveAutoBackup();

    expect(setDoc).not.toHaveBeenCalled();
  });

  it("saves to auto_history when last auto backup was more than 24 hours ago", async () => {
    const { auth } = await import("@/lib/firebase");
    const { getDoc, setDoc, doc } = await import("firebase/firestore");
    const { useSessionStore } = await import("@/stores/sessionStore");

    (auth as { currentUser: unknown }).currentUser = { uid: "pro-user", email: "pro@test.com" };
    useSessionStore.setState({ isPro: true });
    vi.mocked(doc).mockReturnValue({} as ReturnType<typeof doc>);

    const oldBackup = { createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() };
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ auto_history: [oldBackup] }),
    } as Awaited<ReturnType<typeof getDoc>>);

    vi.mocked(setDoc).mockResolvedValueOnce(undefined);

    await saveAutoBackup();

    expect(setDoc).toHaveBeenCalledOnce();
    const payload = vi.mocked(setDoc).mock.calls[0][1] as Record<string, unknown>;
    expect(payload).toHaveProperty("auto_history");
    const history = payload.auto_history as unknown[];
    expect(history.length).toBeLessThanOrEqual(3);
  });

  it("saves to auto_history when no previous auto backup exists", async () => {
    const { auth } = await import("@/lib/firebase");
    const { getDoc, setDoc, doc } = await import("firebase/firestore");
    const { useSessionStore } = await import("@/stores/sessionStore");

    (auth as { currentUser: unknown }).currentUser = { uid: "pro-user", email: "pro@test.com" };
    useSessionStore.setState({ isPro: true });
    vi.mocked(doc).mockReturnValue({} as ReturnType<typeof doc>);

    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => false,
      data: () => undefined,
    } as Awaited<ReturnType<typeof getDoc>>);

    vi.mocked(setDoc).mockResolvedValueOnce(undefined);

    await saveAutoBackup();

    expect(setDoc).toHaveBeenCalledOnce();
    const payload = vi.mocked(setDoc).mock.calls[0][1] as Record<string, unknown>;
    const history = payload.auto_history as unknown[];
    expect(history.length).toBe(1);
  });
});

// ─── restoreFromSnapshot ──────────────────────────────────────────────────────

describe("restoreFromSnapshot", () => {
  const validSnapshot: BackupSnapshot = {
    version: 1,
    createdAt: "2024-06-01T12:00:00.000Z",
    appVersion: "1.0.0",
    origin: "manual",
    scope: "full",
    data: {
      wallet: { sections: [], expenses: [], hasFirstWallet: false },
      list: { taskLists: [], tasks: [], tagsByList: {}, activeListId: "" },
    },
  };

  afterEach(async () => {
    vi.clearAllMocks();
    const { auth } = await import("@/lib/firebase");
    (auth as { currentUser: unknown }).currentUser = null;
  });

  it("throws when user is not authenticated", async () => {
    const { auth } = await import("@/lib/firebase");
    (auth as { currentUser: unknown }).currentUser = null;

    await expect(restoreFromSnapshot(validSnapshot)).rejects.toThrow(/iniciar sesión/);
  });

  it("writes wallet and list keys to localforage", async () => {
    const { auth } = await import("@/lib/firebase");
    (auth as { currentUser: unknown }).currentUser = { uid: "user-123" };

    const localforage = await import("localforage");
    await restoreFromSnapshot(validSnapshot);

    expect(localforage.default.setItem).toHaveBeenCalledWith(
      "waddle-wallet-user-123",
      expect.any(String)
    );
    expect(localforage.default.setItem).toHaveBeenCalledWith(
      "waddle-list-user-123",
      expect.any(String)
    );
  });

  it("writes Zustand persist-compatible JSON to localforage", async () => {
    const { auth } = await import("@/lib/firebase");
    (auth as { currentUser: unknown }).currentUser = { uid: "user-123" };

    const localforage = await import("localforage");
    await restoreFromSnapshot(validSnapshot);

    const walletCall = vi.mocked(localforage.default.setItem).mock.calls.find(
      ([key]) => key === "waddle-wallet-user-123"
    );
    expect(walletCall).toBeDefined();
    const parsed = JSON.parse(walletCall![1] as string);
    expect(parsed).toHaveProperty("state");
    expect(parsed).toHaveProperty("version");
  });

  it("calls rehydrateAllStores after writing to localforage", async () => {
    const { auth } = await import("@/lib/firebase");
    (auth as { currentUser: unknown }).currentUser = { uid: "user-123" };

    const { rehydrateAllStores } = await import("../resetUserStores");
    await restoreFromSnapshot(validSnapshot);

    expect(rehydrateAllStores).toHaveBeenCalledOnce();
  });

  it("applies migration before writing (v0 snapshot gets migrated to v1)", async () => {
    const { auth } = await import("@/lib/firebase");
    (auth as { currentUser: unknown }).currentUser = { uid: "user-123" };

    const legacySnapshot = {
      version: 0,
      createdAt: "2023-01-01T00:00:00.000Z",
      appVersion: "0.9.0",
      origin: "manual" as const,
      scope: "full" as const,
      data: {},
      sections: [{ id: "s1", name: "Food" }],
      expenses: [],
    } as unknown as BackupSnapshot;

    const localforage = await import("localforage");
    await restoreFromSnapshot(legacySnapshot);

    // After migration, wallet data should include the legacy sections
    const walletCall = vi.mocked(localforage.default.setItem).mock.calls.find(
      ([key]) => key === "waddle-wallet-user-123"
    );
    expect(walletCall).toBeDefined();
    const parsed = JSON.parse(walletCall![1] as string);
    expect(parsed.state.sections).toEqual([{ id: "s1", name: "Food" }]);
  });
});
