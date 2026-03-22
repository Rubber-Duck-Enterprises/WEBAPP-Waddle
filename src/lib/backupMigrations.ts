import type { BackupSnapshot } from "@/lib/backupTypes";

// ─── Version ──────────────────────────────────────────────────────────────────

export const CURRENT_BACKUP_VERSION = 1;

// ─── Migration helpers ────────────────────────────────────────────────────────

/**
 * Migration from version 0 → 1.
 *
 * Legacy backups may have top-level keys (`sections`, `expenses`, `taskLists`,
 * `tasks`) instead of the nested structure under `data.wallet` / `data.list`.
 * This migration normalises those keys into the current schema.
 */
function migrateV0ToV1(snapshot: BackupSnapshot): BackupSnapshot {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = snapshot as any;

  const data: BackupSnapshot["data"] = { ...snapshot.data };

  // Normalise legacy wallet keys → data.wallet
  const hasLegacyWallet =
    raw.sections !== undefined || raw.expenses !== undefined;

  if (hasLegacyWallet && !data.wallet) {
    data.wallet = {
      sections: raw.sections ?? [],
      expenses: raw.expenses ?? [],
      hasFirstWallet: raw.hasFirstWallet ?? false,
    };
  }

  // Normalise legacy list keys → data.list
  const hasLegacyList =
    raw.taskLists !== undefined || raw.tasks !== undefined;

  if (hasLegacyList && !data.list) {
    data.list = {
      taskLists: raw.taskLists ?? [],
      tasks: raw.tasks ?? [],
      tagsByList: raw.tagsByList ?? {},
      activeListId: raw.activeListId ?? "all",
    };
  }

  return {
    ...snapshot,
    data,
    version: 1,
  };
}

// ─── migrateSnapshot ──────────────────────────────────────────────────────────

/**
 * Applies chained migrations to bring a snapshot up to CURRENT_BACKUP_VERSION.
 *
 * - If `snapshot.version >= CURRENT_BACKUP_VERSION`, returns the snapshot unchanged.
 * - Otherwise applies each migration step in order until the version is current.
 */
export function migrateSnapshot(snapshot: BackupSnapshot): BackupSnapshot {
  if (snapshot.version >= CURRENT_BACKUP_VERSION) {
    return snapshot;
  }

  let current = snapshot;

  // Chain migrations in order — add new steps here as the schema evolves
  if (current.version < 1) {
    current = migrateV0ToV1(current);
  }

  return current;
}
