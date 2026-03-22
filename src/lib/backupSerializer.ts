import type { BackupSnapshot, BackupOrigin, BackupScope, DeserializedData } from "@/lib/backupTypes";
import { CURRENT_BACKUP_VERSION } from "@/lib/backupMigrations";

// ─── State shape types ────────────────────────────────────────────────────────

export interface WalletStoreState {
  sections: import("@/types").Section[];
  expenses: import("@/types").Expense[];
  hasFirstWallet: boolean;
}

export interface ListStoreState {
  taskLists: import("@/types").TaskList[];
  tasks: import("@/types").Task[];
  tagsByList: Record<string, import("@/types").Tag[]>;
  activeListId: string;
}

// ─── serializeBackup ──────────────────────────────────────────────────────────

/**
 * Builds a BackupSnapshot from the current wallet and list store states.
 * The caller is responsible for passing the current store state.
 *
 * - scope "wallet": only data.wallet is included
 * - scope "list":   only data.list is included
 * - scope "full":   both data.wallet and data.list are included
 */
export function serializeBackup(
  walletState: WalletStoreState,
  listState: ListStoreState,
  origin: BackupOrigin,
  scope: BackupScope
): BackupSnapshot {
  const data: BackupSnapshot["data"] = {};

  if (scope === "wallet" || scope === "full") {
    data.wallet = {
      sections: walletState.sections,
      expenses: walletState.expenses,
      hasFirstWallet: walletState.hasFirstWallet,
    };
  }

  if (scope === "list" || scope === "full") {
    data.list = {
      taskLists: listState.taskLists,
      tasks: listState.tasks,
      tagsByList: listState.tagsByList,
      activeListId: listState.activeListId,
    };
  }

  return {
    version: CURRENT_BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    appVersion: import.meta.env.VITE_APP_VERSION ?? "unknown",
    origin,
    scope,
    data,
  };
}

// ─── validateSnapshot ─────────────────────────────────────────────────────────

/**
 * Type guard that validates whether an unknown value is a structurally valid
 * BackupSnapshot.
 *
 * Checks:
 *  - obj is a non-null object
 *  - version is a number
 *  - createdAt is a string
 *  - data is a non-null object
 *
 * Returns true (and narrows the type) when all checks pass, false otherwise.
 *
 * Validates: Requirements 5.1, 5.4
 */
export function validateSnapshot(obj: unknown): obj is BackupSnapshot {
  if (obj === null || typeof obj !== "object") return false;

  const record = obj as Record<string, unknown>;

  if (typeof record["version"] !== "number") return false;
  if (typeof record["createdAt"] !== "string") return false;

  const data = record["data"];
  if (data === null || typeof data !== "object") return false;

  return true;
}

// ─── deserializeBackup ────────────────────────────────────────────────────────

/**
 * Given a BackupSnapshot and the user's uid, returns DeserializedData with
 * the scoped localforage keys and JSON-serialized values ready to write.
 *
 * Keys follow the pattern used by scopedStorage: "{store_name}-{uid}"
 *   - wallet: "waddle-wallet-{uid}"
 *   - list:   "waddle-list-{uid}"
 *
 * Zustand's persist middleware wraps the state in { state: ..., version: 0 },
 * so we mirror that structure here so the store rehydrates correctly.
 */
export function deserializeBackup(
  snapshot: BackupSnapshot,
  uid: string
): DeserializedData {
  const walletKey = `waddle-wallet-${uid}`;
  const listKey = `waddle-list-${uid}`;

  // Wallet value — use snapshot data if present, otherwise empty state
  const walletState: WalletStoreState = snapshot.data.wallet ?? {
    sections: [],
    expenses: [],
    hasFirstWallet: false,
  };

  // List value — use snapshot data if present, otherwise empty state
  const listState: ListStoreState = snapshot.data.list ?? {
    taskLists: [],
    tasks: [],
    tagsByList: {},
    activeListId: "all",
  };

  // Zustand persist wraps persisted state as { state: <data>, version: 0 }
  const walletValue = JSON.stringify({ state: walletState, version: 0 });
  const listValue = JSON.stringify({ state: listState, version: 0 });

  return { walletKey, walletValue, listKey, listValue };
}
