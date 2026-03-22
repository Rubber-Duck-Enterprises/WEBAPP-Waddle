import type { Section, Expense, TaskList, Task, Tag } from "@/types";

// ─── Origin & Scope ───────────────────────────────────────────────────────────

export type BackupOrigin = "manual" | "automatic";
export type BackupScope = "full" | "wallet" | "list";

// ─── BackupSnapshot ───────────────────────────────────────────────────────────

export interface BackupSnapshot {
  /** Schema version (currently 1) */
  version: number;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** App version from import.meta.env.VITE_APP_VERSION */
  appVersion: string;
  origin: BackupOrigin;
  scope: BackupScope;
  data: {
    wallet?: {
      sections: Section[];
      expenses: Expense[];
      hasFirstWallet: boolean;
    };
    list?: {
      taskLists: TaskList[];
      tasks: Task[];
      tagsByList: Record<string, Tag[]>;
      activeListId: string;
    };
  };
}

// ─── Firestore Documents ──────────────────────────────────────────────────────

/** Free Tier — document at backups/{uid} */
export interface FirestoreBackupDoc {
  manual: BackupSnapshot | null;
  updatedAt: string;
  email: string;
}

/** Pro Tier — extends Free Tier with history slots */
export interface FirestoreBackupDocPro extends FirestoreBackupDoc {
  /** Up to 3 most-recent manual snapshots */
  manual_history: BackupSnapshot[];
  /** Up to 3 most-recent automatic snapshots */
  auto_history: BackupSnapshot[];
}

// ─── Deserialized Data ────────────────────────────────────────────────────────

/** Structured output of deserializeBackup, ready to write into localforage */
export interface DeserializedData {
  /** e.g. "waddle-wallet-{uid}" */
  walletKey: string;
  /** JSON-serialized wallet state for localforage */
  walletValue: string;
  /** e.g. "waddle-list-{uid}" */
  listKey: string;
  /** JSON-serialized list state for localforage */
  listValue: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface BackupValidationResult {
  valid: boolean;
  error?: string;
}
