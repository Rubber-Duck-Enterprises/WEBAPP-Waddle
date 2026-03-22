// Feature: cloud-backup-system, Property 3: Migración produce versión actual

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { migrateSnapshot, CURRENT_BACKUP_VERSION } from "../backupMigrations";
import type { BackupSnapshot } from "@/lib/backupTypes";

// ─── Arbitrary ────────────────────────────────────────────────────────────────

/**
 * Generates a minimal BackupSnapshot with a version strictly below
 * CURRENT_BACKUP_VERSION (i.e. 0 .. CURRENT_BACKUP_VERSION - 1).
 */
const outdatedSnapshotArb: fc.Arbitrary<BackupSnapshot> = fc
  .integer({ min: 0, max: CURRENT_BACKUP_VERSION - 1 })
  .map(
    (version): BackupSnapshot => ({
      version,
      createdAt: new Date().toISOString(),
      appVersion: "0.0.0",
      origin: "manual",
      scope: "full",
      data: {},
    })
  );

// ─── Property 3: Migración produce versión actual ─────────────────────────────

/**
 * Validates: Requirements 1.4, 5.5
 */
describe("Property 3: Migración produce versión actual", () => {
  it("aplicar migrateSnapshot a un snapshot desactualizado produce version === CURRENT_BACKUP_VERSION", () => {
    fc.assert(
      fc.property(outdatedSnapshotArb, (snapshot) => {
        const migrated = migrateSnapshot(snapshot);
        expect(migrated.version).toBe(CURRENT_BACKUP_VERSION);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: cloud-backup-system, Property 4: Idempotencia de migración

// ─── Arbitrary ────────────────────────────────────────────────────────────────

/**
 * Generates a minimal BackupSnapshot with version >= CURRENT_BACKUP_VERSION.
 */
const currentSnapshotArb: fc.Arbitrary<BackupSnapshot> = fc
  .integer({ min: CURRENT_BACKUP_VERSION, max: CURRENT_BACKUP_VERSION + 10 })
  .map(
    (version): BackupSnapshot => ({
      version,
      createdAt: new Date().toISOString(),
      appVersion: "1.0.0",
      origin: "manual",
      scope: "full",
      data: {
        wallet: {
          sections: [],
          expenses: [],
          hasFirstWallet: false,
        },
        list: {
          taskLists: [],
          tasks: [],
          tagsByList: {},
          activeListId: "all",
        },
      },
    })
  );

// ─── Property 4: Idempotencia de migración ────────────────────────────────────

/**
 * Validates: Requirement 1.4
 */
describe("Property 4: Idempotencia de migración", () => {
  it("aplicar migrateSnapshot a un snapshot con version >= CURRENT_BACKUP_VERSION retorna el snapshot sin cambios", () => {
    fc.assert(
      fc.property(currentSnapshotArb, (snapshot) => {
        const migrated = migrateSnapshot(snapshot);
        expect(migrated).toEqual(snapshot);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: cloud-backup-system, Property 8: Compatibilidad con claves legacy

// ─── Arbitrary ────────────────────────────────────────────────────────────────

/**
 * Generates a legacy-format object with top-level `sections`, `expenses`,
 * `taskLists`, and `tasks` arrays (random arrays of plain objects), cast as a
 * BackupSnapshot with version 0.
 */
const legacySnapshotArb: fc.Arbitrary<BackupSnapshot> = fc
  .record({
    sections: fc.array(fc.record({ id: fc.string() })),
    expenses: fc.array(fc.record({ id: fc.string() })),
    taskLists: fc.array(fc.record({ id: fc.string() })),
    tasks: fc.array(fc.record({ id: fc.string() })),
  })
  .map(
    ({ sections, expenses, taskLists, tasks }): BackupSnapshot =>
      ({
        version: 0,
        createdAt: new Date().toISOString(),
        appVersion: "0.0.0",
        origin: "manual",
        scope: "full",
        data: {},
        // legacy top-level keys
        sections,
        expenses,
        taskLists,
        tasks,
      }) as unknown as BackupSnapshot
  );

// ─── Property 8: Compatibilidad con claves legacy ─────────────────────────────

/**
 * Validates: Requirement 5.6
 */
describe("Property 8: Compatibilidad con claves legacy", () => {
  it("normalizar claves legacy produce un snapshot con los datos bajo las claves actuales", () => {
    fc.assert(
      fc.property(legacySnapshotArb, (snapshot) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = snapshot as any;
        const migrated = migrateSnapshot(snapshot);

        expect(migrated.data.wallet?.sections).toEqual(raw.sections);
        expect(migrated.data.wallet?.expenses).toEqual(raw.expenses);
        expect(migrated.data.list?.taskLists).toEqual(raw.taskLists);
        expect(migrated.data.list?.tasks).toEqual(raw.tasks);
      }),
      { numRuns: 100 }
    );
  });
});
